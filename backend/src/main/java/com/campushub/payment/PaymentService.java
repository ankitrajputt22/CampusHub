package com.campushub.payment;

import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.order.OrderService;
import com.campushub.order.dto.OrderInitiationResponse;
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.model.OrderStatusHistory;
import com.campushub.order.model.PaymentStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.order.repository.OrderStatusHistoryRepository;
import com.campushub.payment.dto.PaymentActionResponse;
import com.campushub.payment.dto.PaymentCheckoutResponse;
import com.campushub.payment.dto.PaymentCheckoutResponse.CampusHubOrder;
import com.campushub.payment.dto.PaymentCheckoutResponse.CheckoutPrefill;
import com.campushub.payment.dto.PaymentCheckoutResponse.RazorpayCheckout;
import com.campushub.payment.dto.PaymentFailureRequest;
import com.campushub.payment.dto.PaymentVerificationRequest;
import com.campushub.payment.dto.PaymentVerificationResponse;
import com.campushub.payment.dto.PaymentVerificationResponse.VerifiedListing;
import com.campushub.payment.dto.PaymentVerificationResponse.VerifiedOrder;
import com.campushub.payment.dto.PaymentVerificationResponse.VerifiedPayment;
import com.campushub.payment.dto.PaymentsPageResponse;
import com.campushub.payment.dto.PaymentsPageResponse.PaginationSummary;
import com.campushub.payment.dto.PaymentsPageResponse.PaymentStats;
import com.campushub.payment.dto.PaymentsPageResponse.PaymentSummary;
import com.campushub.payment.model.Payment;
import com.campushub.payment.model.PaymentAttempt;
import com.campushub.payment.razorpay.RazorpayGateway;
import com.campushub.payment.razorpay.RazorpayGateway.CreateRazorpayOrder;
import com.campushub.payment.razorpay.RazorpayGateway.RazorpayOrder;
import com.campushub.payment.razorpay.RazorpayGatewayException;
import com.campushub.payment.razorpay.RazorpayProperties;
import com.campushub.payment.razorpay.RazorpaySignatureVerifier;
import com.campushub.payment.repository.PaymentAttemptRepository;
import com.campushub.payment.repository.PaymentRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private static final String CURRENCY = "INR";
    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentAttemptRepository attemptRepository;
    private final NotificationService notificationService;
    private final OrderService orderService;
    private final RazorpayGateway razorpayGateway;
    private final RazorpayProperties razorpayProperties;
    private final RazorpaySignatureVerifier signatureVerifier;

    public PaymentService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            OrderStatusHistoryRepository historyRepository,
            PaymentRepository paymentRepository,
            PaymentAttemptRepository attemptRepository,
            NotificationService notificationService,
            OrderService orderService,
            RazorpayGateway razorpayGateway,
            RazorpayProperties razorpayProperties,
            RazorpaySignatureVerifier signatureVerifier
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.paymentRepository = paymentRepository;
        this.attemptRepository = attemptRepository;
        this.notificationService = notificationService;
        this.orderService = orderService;
        this.razorpayGateway = razorpayGateway;
        this.razorpayProperties = razorpayProperties;
        this.signatureVerifier = signatureVerifier;
    }

    @Transactional
    public PaymentCheckoutResponse createCheckoutFromListing(
            Long authenticatedUserId,
            Long listingId
    ) {
        requireConfiguredGateway();
        OrderInitiationResponse initiated = orderService.initiateOrder(
                authenticatedUserId,
                listingId
        );
        MarketplaceOrder order = orderRepository
                .findOrderForUpdate(initiated.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order was not found."));
        RazorpayOrder razorpayOrder = createRazorpayOrder(order, order.getOrderNumber());
        Payment payment = paymentRepository.save(new Payment(
                order,
                razorpayOrder.id(),
                razorpayOrder.currency()
        ));
        attemptRepository.save(new PaymentAttempt(order, razorpayOrder.id()));
        return checkoutResponse(order, payment, loadActiveBuyer(authenticatedUserId));
    }

    @Transactional
    public PaymentCheckoutResponse retryPayment(
            Long authenticatedUserId,
            Long orderId
    ) {
        requireConfiguredGateway();
        User buyer = loadActiveBuyer(authenticatedUserId);
        MarketplaceOrder order = loadOrderForUpdate(orderId);
        requireBuyer(order, buyer);
        if (!Set.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED)
                .contains(order.getStatus())
                || order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new ResourceConflictException(
                    "This order is not eligible for another payment attempt."
            );
        }
        Listing listing = listingRepository
                .findMarketplaceListingForUpdate(order.getListing().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing was not found."));
        if (listing.getStatus() != ListingStatus.ACTIVE
                || listing.getAvailableQuantity() < 1) {
            throw new ResourceConflictException(
                    "This item is no longer available for payment."
            );
        }
        long attemptNumber = attemptRepository.countByOrderId(orderId) + 1;
        String receipt = retryReceipt(order.getOrderNumber(), attemptNumber);
        RazorpayOrder razorpayOrder = createRazorpayOrder(order, receipt);
        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElseGet(() -> new Payment(order, razorpayOrder.id(), CURRENCY));
        if (payment.getId() == null) {
            paymentRepository.save(payment);
        } else {
            payment.beginAttempt(razorpayOrder.id());
        }
        OrderStatus previous = order.getStatus();
        order.resetPaymentPending();
        recordHistory(
                order,
                previous,
                order.getStatus(),
                buyer,
                "Buyer started a secure payment retry."
        );
        attemptRepository.save(new PaymentAttempt(order, razorpayOrder.id()));
        return checkoutResponse(order, payment, buyer);
    }

    @Transactional(noRollbackFor = PaymentVerificationException.class)
    public PaymentVerificationResponse verifyPayment(
            Long authenticatedUserId,
            PaymentVerificationRequest request
    ) {
        User buyer = loadActiveBuyer(authenticatedUserId);
        MarketplaceOrder order = loadOrderForUpdate(request.campusHubOrderId());
        requireBuyer(order, buyer);
        Payment payment = paymentRepository
                .findByOrderIdForUpdate(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment record was not found."
                ));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            if (payment.getRazorpayOrderId().equals(request.razorpayOrderId())
                    && request.razorpayPaymentId().equals(
                    payment.getRazorpayPaymentId()
            )) {
                return verificationResponse(order, payment);
            }
            throw new ResourceConflictException("This order is already paid.");
        }
        if (!Set.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED)
                .contains(order.getStatus())) {
            throw new ResourceConflictException(
                    "This order cannot accept a payment verification."
            );
        }
        if (!payment.getRazorpayOrderId().equals(request.razorpayOrderId())) {
            throw new BadRequestException(
                    "The Razorpay order does not match this Campus Hub order."
            );
        }

        PaymentAttempt attempt = attemptRepository
                .findByRazorpayOrderId(payment.getRazorpayOrderId())
                .orElseGet(() -> attemptRepository.save(new PaymentAttempt(
                        order,
                        payment.getRazorpayOrderId()
                )));
        if (!signatureVerifier.isValid(
                payment.getRazorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature()
        )) {
            failVerification(
                    order,
                    payment,
                    attempt,
                    request.razorpayPaymentId(),
                    "Razorpay signature verification failed."
            );
            throw new PaymentVerificationException(
                    "Payment verification failed. Contact support if money was deducted."
            );
        }

        Listing listing = listingRepository
                .findMarketplaceListingForUpdate(order.getListing().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Listing was not found."));
        if (listing.getStatus() != ListingStatus.ACTIVE
                || listing.getAvailableQuantity() < 1) {
            failVerification(
                    order,
                    payment,
                    attempt,
                    request.razorpayPaymentId(),
                    "Listing became unavailable before payment verification."
            );
            throw new PaymentVerificationException(
                    "Payment needs manual review because the item became unavailable. "
                            + "Contact support if money was deducted."
            );
        }

        OrderStatus previous = order.getStatus();
        payment.markSuccessful(
                request.razorpayPaymentId(),
                request.razorpaySignature()
        );
        attempt.markSuccessful(request.razorpayPaymentId());
        order.markPaid();
        if (listing.getAvailableQuantity() <= 1) {
            listing.changeStatus(ListingStatus.SOLD);
            notificationService.notifyWishlistUnavailable(listing, true);
        }
        recordHistory(
                order,
                previous,
                order.getStatus(),
                buyer,
                "Payment signature verified by Campus Hub."
        );
        notificationService.notify(
                buyer,
                NotificationType.PAYMENT,
                NotificationPriority.HIGH,
                "Payment successful",
                "Your payment of ₹" + order.getAmount().toPlainString()
                        + " for " + order.getListing().getTitle()
                        + " was successful.",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        notificationService.notify(
                order.getSeller(),
                NotificationType.PAYMENT,
                NotificationPriority.HIGH,
                "Payment confirmed",
                "A payment of ₹" + order.getAmount().toPlainString()
                        + " for " + order.getListing().getTitle()
                        + " was verified successfully.",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        notificationService.notify(
                order.getSeller(),
                NotificationType.LISTING,
                NotificationPriority.MEDIUM,
                "Listing sold",
                "Your listing " + order.getListing().getTitle()
                        + " has been sold.",
                RelatedEntityType.LISTING,
                order.getListing().getId(),
                "/student/my-marketplace"
        );
        return verificationResponse(order, payment);
    }

    @Transactional
    public PaymentActionResponse recordFailure(
            Long authenticatedUserId,
            PaymentFailureRequest request
    ) {
        User buyer = loadActiveBuyer(authenticatedUserId);
        MarketplaceOrder order = loadOrderForUpdate(request.campusHubOrderId());
        requireBuyer(order, buyer);
        Payment payment = paymentRepository
                .findByOrderIdForUpdate(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment record was not found."
                ));
        if (!payment.getRazorpayOrderId().equals(request.razorpayOrderId())) {
            throw new BadRequestException(
                    "The Razorpay order does not match this Campus Hub order."
            );
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new ResourceConflictException("This order is already paid.");
        }
        if (order.getStatus() == OrderStatus.PAYMENT_FAILED) {
            return actionResponse(order, payment);
        }
        String reason = failureReason(request.errorCode(), request.errorDescription());
        PaymentAttempt attempt = attemptRepository
                .findByRazorpayOrderId(payment.getRazorpayOrderId())
                .orElseGet(() -> attemptRepository.save(new PaymentAttempt(
                        order,
                        payment.getRazorpayOrderId()
                )));
        OrderStatus previous = order.getStatus();
        payment.markFailed(null, reason);
        attempt.markFailed(null, reason);
        order.markPaymentFailed();
        recordHistory(order, previous, order.getStatus(), buyer, reason);
        notificationService.notify(
                buyer,
                NotificationType.PAYMENT,
                NotificationPriority.HIGH,
                "Payment failed",
                "Your payment for " + order.getListing().getTitle()
                        + " failed. Please try again.",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        return actionResponse(order, payment);
    }

    @Transactional(readOnly = true)
    public PaymentsPageResponse getMyPayments(
            Long authenticatedUserId,
            String search,
            String statusValue,
            int page,
            int size
    ) {
        User user = loadActiveBuyer(authenticatedUserId);
        validatePage(page, size);
        PaymentStatus status = parseStatus(statusValue);
        Specification<Payment> party = partySpecification(user.getId());
        Specification<Payment> filtered = party.and((root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("order").get("orderNumber")), term),
                        builder.like(builder.lower(root.get("listing").get("title")), term),
                        builder.like(builder.lower(root.get("razorpayPaymentId")), term)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        });
        Page<Payment> result = paymentRepository.findAll(
                filtered,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return new PaymentsPageResponse(
                paymentStats(user.getId(), party),
                result.getContent().stream()
                        .map(payment -> summary(payment, user.getId()))
                        .toList(),
                new PaginationSummary(
                        result.getNumber(),
                        result.getSize(),
                        result.getTotalElements(),
                        result.getTotalPages(),
                        result.hasNext()
                )
        );
    }

    @Transactional(readOnly = true)
    public PaymentSummary getPaymentDetails(Long authenticatedUserId, Long paymentId) {
        User user = loadActiveBuyer(authenticatedUserId);
        Payment payment = paymentRepository.findPaymentDetailsById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment was not found."
                ));
        if (!isParty(payment, user.getId())) {
            throw new ResourceNotFoundException("Payment was not found.");
        }
        return summary(payment, user.getId());
    }

    private RazorpayOrder createRazorpayOrder(MarketplaceOrder order, String receipt) {
        Map<String, String> notes = new LinkedHashMap<>();
        notes.put("campusHubOrderId", order.getId().toString());
        notes.put("listingId", order.getListing().getId().toString());
        notes.put("buyerId", order.getBuyer().getId().toString());
        notes.put("sellerId", order.getSeller().getId().toString());
        notes.put("collegeId", order.getListing().getCollege().getId().toString());
        RazorpayOrder razorpayOrder = razorpayGateway.createOrder(new CreateRazorpayOrder(
                amountInSubunits(order.getAmount()),
                CURRENCY,
                receipt,
                Map.copyOf(notes)
        ));
        if (razorpayOrder.amount() != amountInSubunits(order.getAmount())
                || !CURRENCY.equalsIgnoreCase(razorpayOrder.currency())) {
            throw new RazorpayGatewayException(
                    "Razorpay returned an order with an unexpected amount or currency."
            );
        }
        return razorpayOrder;
    }

    private PaymentCheckoutResponse checkoutResponse(
            MarketplaceOrder order,
            Payment payment,
            User buyer
    ) {
        return new PaymentCheckoutResponse(
                new CampusHubOrder(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getListing().getId(),
                        order.getListing().getTitle(),
                        order.getAmount(),
                        order.getStatus().name(),
                        order.getPaymentStatus().name()
                ),
                new RazorpayCheckout(
                        razorpayProperties.keyId(),
                        payment.getRazorpayOrderId(),
                        amountInSubunits(order.getAmount()),
                        payment.getCurrency(),
                        "Campus Hub",
                        "Payment for " + order.getListing().getTitle()
                ),
                new CheckoutPrefill(
                        buyer.getFullName(),
                        buyer.getEmail(),
                        buyer.getPhoneNumber()
                )
        );
    }

    private PaymentVerificationResponse verificationResponse(
            MarketplaceOrder order,
            Payment payment
    ) {
        return new PaymentVerificationResponse(
                true,
                new VerifiedOrder(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getStatus().name(),
                        order.getPaymentStatus().name(),
                        order.getAmount()
                ),
                new VerifiedPayment(
                        payment.getId(),
                        payment.getRazorpayPaymentId(),
                        payment.getRazorpayOrderId(),
                        payment.getStatus().name(),
                        payment.getPaidAt()
                ),
                new VerifiedListing(
                        order.getListing().getId(),
                        order.getListing().getStatus().name()
                )
        );
    }

    private void failVerification(
            MarketplaceOrder order,
            Payment payment,
            PaymentAttempt attempt,
            String paymentId,
            String reason
    ) {
        OrderStatus previous = order.getStatus();
        payment.markFailed(paymentId, reason);
        attempt.markVerificationFailed(paymentId);
        order.markPaymentFailed();
        recordHistory(order, previous, order.getStatus(), order.getBuyer(), reason);
        notificationService.notify(
                order.getBuyer(),
                NotificationType.PAYMENT,
                NotificationPriority.CRITICAL,
                "Payment verification failed",
                "Payment verification failed for " + order.getListing().getTitle()
                        + ". Contact support if money was deducted.",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
    }

    private PaymentStats paymentStats(
            Long userId,
            Specification<Payment> party
    ) {
        return new PaymentStats(
                paymentRepository.count(party),
                paymentRepository.count(party.and(statusSpecification(PaymentStatus.SUCCESS))),
                paymentRepository.count(party.and(statusSpecification(PaymentStatus.PENDING))),
                paymentRepository.count(party.and(statusSpecification(PaymentStatus.FAILED))),
                paymentRepository.count(party.and(statusSpecification(PaymentStatus.REFUNDED))),
                paymentRepository.sumAmountByBuyerIdAndStatus(
                        userId,
                        PaymentStatus.SUCCESS
                )
        );
    }

    private PaymentSummary summary(Payment payment, Long userId) {
        boolean buyer = payment.getBuyer().getId().equals(userId);
        return new PaymentSummary(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getOrder().getOrderNumber(),
                buyer ? "BUYER" : "SELLER",
                payment.getListing().getId(),
                payment.getListing().getTitle(),
                payment.getListing().getPrimaryImageUrl(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus().name(),
                payment.getOrder().getStatus().name(),
                payment.getPaymentMethod() == null
                        ? "Razorpay Checkout"
                        : payment.getPaymentMethod(),
                payment.getRazorpayPaymentId(),
                payment.getRefundStatus().name(),
                payment.getFailureReason(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                buyer
                        && payment.getStatus() != PaymentStatus.SUCCESS
                        && Set.of(
                        OrderStatus.PENDING_PAYMENT,
                        OrderStatus.PAYMENT_FAILED
                ).contains(payment.getOrder().getStatus())
        );
    }

    private Specification<Payment> partySpecification(Long userId) {
        return (root, query, builder) -> builder.or(
                builder.equal(root.get("buyer").get("id"), userId),
                builder.equal(root.get("seller").get("id"), userId)
        );
    }

    private Specification<Payment> statusSpecification(PaymentStatus status) {
        return (root, query, builder) -> builder.equal(root.get("status"), status);
    }

    private PaymentStatus parseStatus(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return PaymentStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported payment status.");
        }
    }

    private MarketplaceOrder loadOrderForUpdate(Long orderId) {
        return orderRepository.findOrderForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order was not found."));
    }

    private User loadActiveBuyer(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student account was not found."
                ));
        if (user.getRole() != UserRole.STUDENT || user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("An active student account is required.");
        }
        if (!user.isEmailVerified() || !user.isPhoneVerified()) {
            throw new ForbiddenException(
                    "Verified college email and phone are required before payment."
            );
        }
        if (!user.getCollege().isActive()) {
            throw new ForbiddenException(
                    "Your college marketplace is currently unavailable."
            );
        }
        return user;
    }

    private void requireBuyer(MarketplaceOrder order, User buyer) {
        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new ResourceNotFoundException("Order was not found.");
        }
    }

    private boolean isParty(Payment payment, Long userId) {
        return payment.getBuyer().getId().equals(userId)
                || payment.getSeller().getId().equals(userId);
    }

    private void recordHistory(
            MarketplaceOrder order,
            OrderStatus oldStatus,
            OrderStatus newStatus,
            User changedBy,
            String note
    ) {
        historyRepository.save(new OrderStatusHistory(
                order,
                oldStatus,
                newStatus,
                changedBy,
                note
        ));
    }

    private String orderUrl(MarketplaceOrder order) {
        return "/student/orders/" + order.getId();
    }

    private PaymentActionResponse actionResponse(
            MarketplaceOrder order,
            Payment payment
    ) {
        return new PaymentActionResponse(
                order.getId(),
                payment.getId(),
                order.getStatus().name(),
                payment.getStatus().name(),
                payment.getFailureReason(),
                payment.getUpdatedAt()
        );
    }

    private long amountInSubunits(BigDecimal amount) {
        try {
            return amount.movePointRight(2).longValueExact();
        } catch (ArithmeticException exception) {
            throw new BadRequestException("The listing amount cannot be processed.");
        }
    }

    private String retryReceipt(String orderNumber, long attemptNumber) {
        String suffix = "-R" + attemptNumber;
        int maximumBaseLength = 40 - suffix.length();
        String base = orderNumber.length() > maximumBaseLength
                ? orderNumber.substring(0, maximumBaseLength)
                : orderNumber;
        return base + suffix;
    }

    private String failureReason(String code, String description) {
        String safeCode = code == null || code.isBlank()
                ? "PAYMENT_FAILED"
                : code.trim();
        String safeDescription = description == null || description.isBlank()
                ? "Razorpay Checkout reported a failed payment."
                : description.trim();
        return (safeCode + ": " + safeDescription).substring(
                0,
                Math.min(500, safeCode.length() + safeDescription.length() + 2)
        );
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page must be 0 or greater and size must be 1-50.");
        }
    }

    private void requireConfiguredGateway() {
        if (!razorpayProperties.isConfigured()) {
            throw new RazorpayGatewayException(
                    "Razorpay is not configured. Add test API credentials and try again."
            );
        }
    }
}
