package com.campushub.order;

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
import com.campushub.order.dto.OrderActionResponse;
import com.campushub.order.dto.OrderDetailsResponse;
import com.campushub.order.dto.OrderDetailsResponse.TimelineEntry;
import com.campushub.order.dto.OrderInitiationResponse;
import com.campushub.order.dto.OrdersPageResponse;
import com.campushub.order.dto.OrdersPageResponse.ListingSummary;
import com.campushub.order.dto.OrdersPageResponse.OrderStats;
import com.campushub.order.dto.OrdersPageResponse.OrderSummary;
import com.campushub.order.dto.OrdersPageResponse.OtherPartySummary;
import com.campushub.order.dto.OrdersPageResponse.PaginationSummary;
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.model.OrderStatusHistory;
import com.campushub.order.model.PaymentStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.order.repository.OrderStatusHistoryRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final NotificationService notificationService;
    private final TrustScoreRepository trustScoreRepository;

    public OrderService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            OrderStatusHistoryRepository historyRepository,
            NotificationService notificationService,
            TrustScoreRepository trustScoreRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.historyRepository = historyRepository;
        this.notificationService = notificationService;
        this.trustScoreRepository = trustScoreRepository;
    }

    @Transactional
    public OrderInitiationResponse initiateOrder(Long authenticatedUserId, Long listingId) {
        User buyer = loadActiveStudent(authenticatedUserId);
        Listing listing = listingRepository.findMarketplaceListingForUpdate(listingId)
                .filter(item -> item.getCollege().getId().equals(buyer.getCollege().getId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This listing is unavailable in your college marketplace."
                ));

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new ResourceConflictException("This listing is no longer available to buy.");
        }
        if (listing.getSeller().getStatus() != AccountStatus.ACTIVE) {
            throw new ResourceConflictException("This seller is currently unavailable.");
        }
        if (listing.getSeller().getId().equals(buyer.getId())) {
            throw new ForbiddenException("You cannot buy your own listing.");
        }
        if (orderRepository.existsByListingIdAndStatus(listingId, OrderStatus.PENDING_PAYMENT)) {
            throw new ResourceConflictException(
                    "A payment is already pending for this listing."
            );
        }

        MarketplaceOrder order = orderRepository.save(new MarketplaceOrder(
                listing,
                buyer,
                listing.getSeller(),
                OrderStatus.PENDING_PAYMENT
        ));
        recordHistory(
                order,
                null,
                OrderStatus.PENDING_PAYMENT,
                buyer,
                "Order created; secure payment is pending."
        );
        notificationService.notify(
                buyer,
                NotificationType.ORDER,
                NotificationPriority.MEDIUM,
                "Order created",
                "Your order for " + listing.getTitle()
                        + " has been created. Complete payment to confirm it.",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        notificationService.notify(
                listing.getSeller(),
                NotificationType.ORDER,
                NotificationPriority.MEDIUM,
                "New order received",
                buyer.getFullName() + " created an order for " + listing.getTitle() + ".",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        return new OrderInitiationResponse(
                order.getId(),
                listing.getId(),
                listing.getTitle(),
                order.getAmount(),
                order.getStatus().name(),
                true,
                "Continue to the secure payment step.",
                order.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public OrdersPageResponse getBuyerOrders(
            Long authenticatedUserId,
            String search,
            String status,
            String paymentStatus,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String dateRange,
            String sortBy,
            int page,
            int size
    ) {
        return getOrders(
                loadActiveStudent(authenticatedUserId),
                OrderRole.BUYER,
                search,
                status,
                paymentStatus,
                category,
                minPrice,
                maxPrice,
                dateRange,
                sortBy,
                page,
                size
        );
    }

    @Transactional(readOnly = true)
    public OrdersPageResponse getSellerOrders(
            Long authenticatedUserId,
            String search,
            String status,
            String paymentStatus,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String dateRange,
            String sortBy,
            int page,
            int size
    ) {
        return getOrders(
                loadActiveStudent(authenticatedUserId),
                OrderRole.SELLER,
                search,
                status,
                paymentStatus,
                category,
                minPrice,
                maxPrice,
                dateRange,
                sortBy,
                page,
                size
        );
    }

    @Transactional(readOnly = true)
    public OrderDetailsResponse getOrderDetails(Long authenticatedUserId, Long orderId) {
        User user = loadActiveStudent(authenticatedUserId);
        MarketplaceOrder order = loadVisibleOrder(orderId, user);
        OrderRole role = roleFor(order, user);
        User otherParty = role == OrderRole.BUYER ? order.getSeller() : order.getBuyer();
        int trustScore = trustScoreRepository.findByUserId(otherParty.getId())
                .map(TrustScore::getScore)
                .orElse(0);
        List<TimelineEntry> timeline = historyRepository
                .findByOrderIdOrderByCreatedAtAsc(order.getId())
                .stream()
                .map(entry -> new TimelineEntry(
                        entry.getNewStatus().name(),
                        entry.getNote(),
                        entry.getCreatedAt()
                ))
                .toList();
        if (timeline.isEmpty()) {
            timeline = List.of(new TimelineEntry(
                    order.getStatus().name(),
                    "Current order status.",
                    order.getCreatedAt()
            ));
        }
        return new OrderDetailsResponse(
                order.getId(),
                order.getOrderNumber(),
                role.name(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getAmount(),
                order.getPickupLocation(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getPaidAt(),
                order.getCompletedAt(),
                order.getCancelledAt(),
                listingSummary(order),
                otherPartySummary(otherParty, trustScore),
                timeline,
                availableActions(order, role)
        );
    }

    @Transactional
    public OrderActionResponse cancelOrder(Long authenticatedUserId, Long orderId) {
        User buyer = loadActiveStudent(authenticatedUserId);
        MarketplaceOrder order = loadOrderForUpdate(orderId);
        requireRole(order, buyer, OrderRole.BUYER);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT
                || order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new ResourceConflictException(
                    "Only an order awaiting payment can be cancelled."
            );
        }
        OrderStatus previous = order.getStatus();
        order.cancel();
        recordHistory(order, previous, order.getStatus(), buyer, "Cancelled by buyer.");
        notificationService.notify(
                order.getSeller(),
                NotificationType.ORDER,
                NotificationPriority.MEDIUM,
                "Order cancelled",
                buyer.getFullName() + " cancelled " + order.getOrderNumber() + ".",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        notificationService.notify(
                buyer,
                NotificationType.ORDER,
                NotificationPriority.LOW,
                "Order cancelled",
                order.getOrderNumber() + " was cancelled successfully.",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        return actionResponse(order, "The pending order was cancelled.");
    }

    @Transactional
    public OrderActionResponse markReadyForPickup(Long authenticatedUserId, Long orderId) {
        User seller = loadActiveStudent(authenticatedUserId);
        MarketplaceOrder order = loadOrderForUpdate(orderId);
        requireRole(order, seller, OrderRole.SELLER);
        if (order.getStatus() != OrderStatus.PAID
                || order.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new ResourceConflictException(
                    "Only a successfully paid order can be marked ready for pickup."
            );
        }
        OrderStatus previous = order.getStatus();
        order.markReadyForPickup();
        recordHistory(
                order,
                previous,
                order.getStatus(),
                seller,
                "Seller marked the item ready for pickup."
        );
        notificationService.notify(
                order.getBuyer(),
                NotificationType.ORDER,
                NotificationPriority.HIGH,
                "Your order is ready",
                order.getOrderNumber() + " is ready at " + order.getPickupLocation() + ".",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        return actionResponse(order, "The buyer has been notified that the item is ready.");
    }

    @Transactional
    public OrderActionResponse confirmPickup(Long authenticatedUserId, Long orderId) {
        User buyer = loadActiveStudent(authenticatedUserId);
        MarketplaceOrder order = loadOrderForUpdate(orderId);
        requireRole(order, buyer, OrderRole.BUYER);
        if (!Set.of(OrderStatus.PAID, OrderStatus.READY_FOR_PICKUP)
                .contains(order.getStatus())
                || order.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new ResourceConflictException(
                    "Pickup can only be confirmed for a successfully paid order."
            );
        }
        OrderStatus previous = order.getStatus();
        order.confirmPickup();
        if (order.getListing().getStatus() != ListingStatus.SOLD) {
            order.getListing().changeStatus(ListingStatus.SOLD);
        }
        recordHistory(
                order,
                previous,
                order.getStatus(),
                buyer,
                "Buyer confirmed inspection and item handover."
        );
        notificationService.notify(
                order.getSeller(),
                NotificationType.ORDER,
                NotificationPriority.HIGH,
                "Pickup completed",
                buyer.getFullName() + " completed " + order.getOrderNumber() + ".",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        notificationService.notify(
                buyer,
                NotificationType.ORDER,
                NotificationPriority.HIGH,
                "Order completed",
                "Your order for " + order.getListing().getTitle()
                        + " has been completed.",
                RelatedEntityType.ORDER,
                order.getId(),
                orderUrl(order)
        );
        notificationService.notify(
                buyer,
                NotificationType.REVIEW,
                NotificationPriority.MEDIUM,
                "Review pending",
                "Your order is complete. Please review the seller for "
                        + order.getListing().getTitle() + ".",
                RelatedEntityType.ORDER,
                order.getId(),
                "/student/reviews"
        );
        return actionResponse(order, "Pickup confirmed and the order is complete.");
    }

    private OrdersPageResponse getOrders(
            User user,
            OrderRole role,
            String search,
            String statusValue,
            String paymentStatusValue,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String dateRange,
            String sortBy,
            int page,
            int size
    ) {
        validatePage(page, size);
        validatePrices(minPrice, maxPrice);
        OrderStatus status = parseEnum(statusValue, OrderStatus.class, "order status");
        PaymentStatus paymentStatus = parseEnum(
                paymentStatusValue,
                PaymentStatus.class,
                "payment status"
        );
        Instant createdAfter = dateCutoff(dateRange);

        Specification<MarketplaceOrder> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            String owner = role == OrderRole.BUYER ? "buyer" : "seller";
            String other = role == OrderRole.BUYER ? "seller" : "buyer";
            predicates.add(builder.equal(root.get(owner).get("id"), user.getId()));
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (paymentStatus != null) {
                predicates.add(builder.equal(root.get("paymentStatus"), paymentStatus));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(builder.equal(
                        builder.lower(root.get("listing").get("category")),
                        category.trim().toLowerCase(Locale.ROOT)
                ));
            }
            if (minPrice != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("amount"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("amount"), maxPrice));
            }
            if (createdAfter != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), createdAfter));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("orderNumber")), term),
                        builder.like(builder.lower(root.get("listing").get("title")), term),
                        builder.like(builder.lower(root.get(other).get("fullName")), term)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };

        Page<MarketplaceOrder> result = orderRepository.findAll(
                specification,
                PageRequest.of(page, size, orderSort(sortBy))
        );
        Map<Long, Integer> trustScores = trustScores(
                result.getContent().stream()
                        .map(order -> role == OrderRole.BUYER
                                ? order.getSeller().getId()
                                : order.getBuyer().getId())
                        .toList()
        );
        List<OrderSummary> orders = result.getContent().stream()
                .map(order -> orderSummary(order, role, trustScores))
                .toList();

        return new OrdersPageResponse(
                stats(user.getId(), role),
                orders,
                new PaginationSummary(
                        result.getNumber(),
                        result.getSize(),
                        result.getTotalElements(),
                        result.getTotalPages(),
                        result.hasNext()
                )
        );
    }

    private OrderSummary orderSummary(
            MarketplaceOrder order,
            OrderRole role,
            Map<Long, Integer> trustScores
    ) {
        User otherParty = role == OrderRole.BUYER ? order.getSeller() : order.getBuyer();
        int trustScore = trustScores.getOrDefault(otherParty.getId(), 0);
        return new OrderSummary(
                order.getId(),
                order.getOrderNumber(),
                role.name(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getAmount(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getPickupLocation(),
                listingSummary(order),
                otherPartySummary(otherParty, trustScore),
                availableActions(order, role)
        );
    }

    private ListingSummary listingSummary(MarketplaceOrder order) {
        Listing listing = order.getListing();
        return new ListingSummary(
                listing.getId(),
                listing.getTitle(),
                listing.getCategory(),
                listing.getCondition().name(),
                listing.getPrimaryImageUrl()
        );
    }

    private OtherPartySummary otherPartySummary(User user, int trustScore) {
        return new OtherPartySummary(
                user.getId(),
                user.getFullName(),
                user.getProfilePhotoUrl(),
                trustScore,
                trustLevel(trustScore)
        );
    }

    private OrderStats stats(Long userId, OrderRole role) {
        return new OrderStats(
                count(userId, role, null),
                count(userId, role, OrderStatus.PENDING_PAYMENT),
                count(userId, role, OrderStatus.PAID),
                count(userId, role, OrderStatus.READY_FOR_PICKUP),
                count(userId, role, OrderStatus.COMPLETED),
                count(userId, role, OrderStatus.CANCELLED)
        );
    }

    private long count(Long userId, OrderRole role, OrderStatus status) {
        if (role == OrderRole.BUYER) {
            return status == null
                    ? orderRepository.countByBuyerId(userId)
                    : orderRepository.countByBuyerIdAndStatus(userId, status);
        }
        return status == null
                ? orderRepository.count((root, query, builder) ->
                        builder.equal(root.get("seller").get("id"), userId))
                : orderRepository.countBySellerIdAndStatus(userId, status);
    }

    private List<String> availableActions(MarketplaceOrder order, OrderRole role) {
        List<String> actions = new ArrayList<>();
        actions.add("VIEW_DETAILS");
        if (role == OrderRole.BUYER) {
            if (Set.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED)
                    .contains(order.getStatus())) {
                actions.add("PAY_NOW");
            }
            if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
                actions.add("CANCEL_ORDER");
            }
            if (Set.of(OrderStatus.PAID, OrderStatus.READY_FOR_PICKUP)
                    .contains(order.getStatus())
                    && order.getPaymentStatus() == PaymentStatus.SUCCESS) {
                actions.add("CONFIRM_PICKUP");
            }
            if (order.getStatus() == OrderStatus.COMPLETED) {
                actions.add("WRITE_REVIEW");
            }
        } else if (order.getStatus() == OrderStatus.PAID
                && order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            actions.add("MARK_READY_FOR_PICKUP");
        }
        return List.copyOf(actions);
    }

    private MarketplaceOrder loadVisibleOrder(Long orderId, User user) {
        MarketplaceOrder order = orderRepository.findOrderDetailsById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order was not found."));
        if (!isParty(order, user)) {
            throw new ResourceNotFoundException("Order was not found.");
        }
        return order;
    }

    private MarketplaceOrder loadOrderForUpdate(Long orderId) {
        return orderRepository.findOrderForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order was not found."));
    }

    private void requireRole(MarketplaceOrder order, User user, OrderRole requiredRole) {
        if (!isParty(order, user) || roleFor(order, user) != requiredRole) {
            throw new ResourceNotFoundException("Order was not found.");
        }
    }

    private boolean isParty(MarketplaceOrder order, User user) {
        return order.getBuyer().getId().equals(user.getId())
                || order.getSeller().getId().equals(user.getId());
    }

    private OrderRole roleFor(MarketplaceOrder order, User user) {
        return order.getBuyer().getId().equals(user.getId())
                ? OrderRole.BUYER
                : OrderRole.SELLER;
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

    private OrderActionResponse actionResponse(MarketplaceOrder order, String message) {
        return new OrderActionResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getUpdatedAt(),
                message
        );
    }

    private Map<Long, Integer> trustScores(Collection<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> scores = new HashMap<>();
        trustScoreRepository.findAllByUserIdIn(
                userIds.stream().collect(Collectors.toSet())
        ).forEach(score -> scores.put(score.getUser().getId(), score.getScore()));
        return scores;
    }

    private Sort orderSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank() || sortBy.equalsIgnoreCase("recent")) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "priceasc" -> Sort.by(Sort.Direction.ASC, "amount");
            case "pricedesc" -> Sort.by(Sort.Direction.DESC, "amount");
            default -> throw new BadRequestException("Unsupported order sort option.");
        };
    }

    private Instant dateCutoff(String dateRange) {
        if (dateRange == null || dateRange.isBlank() || dateRange.equalsIgnoreCase("all")) {
            return null;
        }
        Instant now = Instant.now();
        return switch (dateRange.toLowerCase(Locale.ROOT)) {
            case "today" -> now.minus(1, ChronoUnit.DAYS);
            case "week" -> now.minus(7, ChronoUnit.DAYS);
            case "month" -> now.minus(30, ChronoUnit.DAYS);
            default -> throw new BadRequestException("Unsupported order date range.");
        };
    }

    private <E extends Enum<E>> E parseEnum(
            String value,
            Class<E> enumType,
            String label
    ) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported " + label + ".");
        }
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page must be 0 or greater and size must be 1-50.");
        }
    }

    private void validatePrices(BigDecimal minPrice, BigDecimal maxPrice) {
        if ((minPrice != null && minPrice.signum() < 0)
                || (maxPrice != null && maxPrice.signum() < 0)
                || (minPrice != null && maxPrice != null
                && minPrice.compareTo(maxPrice) > 0)) {
            throw new BadRequestException("Enter a valid order price range.");
        }
    }

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student account was not found."));
        if (user.getRole() != UserRole.STUDENT || user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("An active student account is required.");
        }
        if (!user.isEmailVerified() || !user.isPhoneVerified()) {
            throw new ForbiddenException(
                    "Verified college email and phone are required before payment."
            );
        }
        if (!user.getCollege().isActive()) {
            throw new ForbiddenException("Your college marketplace is currently unavailable.");
        }
        return user;
    }

    private String trustLevel(int score) {
        if (score >= 80) {
            return "Trusted Student";
        }
        if (score >= 50) {
            return "Average Trust";
        }
        return "New / Low Trust";
    }

    private enum OrderRole {
        BUYER,
        SELLER
    }
}
