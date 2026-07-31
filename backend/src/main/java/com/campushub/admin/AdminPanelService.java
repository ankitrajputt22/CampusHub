package com.campushub.admin;

import com.campushub.admin.dto.AdminPanelResponses.AdminDashboardResponse;
import com.campushub.admin.dto.AdminPanelResponses.AdminListingDetailsResponse;
import com.campushub.admin.dto.AdminPanelResponses.AdminListingItem;
import com.campushub.admin.dto.AdminPanelResponses.AdminOrderItem;
import com.campushub.admin.dto.AdminPanelResponses.AdminPaymentItem;
import com.campushub.admin.dto.AdminPanelResponses.AdminReviewItem;
import com.campushub.admin.dto.AdminPanelResponses.AdminUserDetailsResponse;
import com.campushub.admin.dto.AdminPanelResponses.AdminUserItem;
import com.campushub.admin.dto.AdminPanelResponses.AuditLogItem;
import com.campushub.admin.dto.AdminPanelResponses.DashboardStats;
import com.campushub.admin.dto.AdminPanelResponses.OrderPaymentSummary;
import com.campushub.admin.dto.AdminPanelResponses.PageResponse;
import com.campushub.admin.dto.AdminPanelResponses.Pagination;
import com.campushub.admin.dto.AdminPanelResponses.PendingReportItem;
import com.campushub.admin.dto.AdminPanelResponses.RecentListingItem;
import com.campushub.admin.dto.AdminPanelResponses.RecentUserItem;
import com.campushub.admin.model.AdminAuditLog;
import com.campushub.admin.repository.AdminAuditLogRepository;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.model.PaymentStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.payment.model.Payment;
import com.campushub.payment.model.RefundStatus;
import com.campushub.payment.repository.PaymentRepository;
import com.campushub.report.model.Report;
import com.campushub.report.model.ReportStatus;
import com.campushub.report.model.ReportType;
import com.campushub.report.repository.ReportRepository;
import com.campushub.review.model.ReviewStatus;
import com.campushub.review.model.SellerReview;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.wishlist.repository.WishlistItemRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPanelService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final AdminAccessService adminAccessService;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReportRepository reportRepository;
    private final SellerReviewRepository reviewRepository;
    private final WishlistItemRepository wishlistRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public AdminPanelService(
            AdminAccessService adminAccessService,
            UserRepository userRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            PaymentRepository paymentRepository,
            ReportRepository reportRepository,
            SellerReviewRepository reviewRepository,
            WishlistItemRepository wishlistRepository,
            AdminAuditLogRepository auditLogRepository
    ) {
        this.adminAccessService = adminAccessService;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.reportRepository = reportRepository;
        this.reviewRepository = reviewRepository;
        this.wishlistRepository = wishlistRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard(Long adminId) {
        adminAccessService.requireActiveAdmin(adminId);
        return new AdminDashboardResponse(
                new DashboardStats(
                        userRepository.count(),
                        userRepository.countByStatus(AccountStatus.ACTIVE),
                        listingRepository.count(),
                        listingRepository.countByStatus(ListingStatus.ACTIVE),
                        orderRepository.count(),
                        reportRepository.countByStatus(ReportStatus.PENDING),
                        listingRepository.countByStatus(ListingStatus.BLOCKED),
                        reviewRepository.count()
                ),
                reportRepository.findTop5ByStatusOrderByCreatedAtDesc(
                                ReportStatus.PENDING
                        )
                        .stream()
                        .map(this::toPendingReport)
                        .toList(),
                listingRepository.findTop5ByOrderByCreatedAtDesc()
                        .stream()
                        .map(this::toRecentListing)
                        .toList(),
                userRepository.findTop5ByRoleOrderByCreatedAtDesc(UserRole.STUDENT)
                        .stream()
                        .map(this::toRecentUser)
                        .toList(),
                new OrderPaymentSummary(
                        orderRepository.count(),
                        orderRepository.countByStatus(OrderStatus.COMPLETED),
                        paymentRepository.countByStatus(PaymentStatus.SUCCESS),
                        paymentRepository.countByStatus(PaymentStatus.FAILED),
                        paymentRepository.countByStatus(PaymentStatus.PENDING)
                ),
                auditLogRepository.findTop8ByOrderByCreatedAtDesc()
                        .stream()
                        .map(this::toAuditLog)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserItem> getUsers(
            Long adminId,
            String search,
            String status,
            String role,
            Long collegeId,
            Boolean emailVerified,
            Boolean phoneVerified,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        adminAccessService.requireActiveAdmin(adminId);
        PageRequest pageRequest = pageRequest(
                requestedPage,
                requestedSize,
                userSort(sortBy)
        );
        Page<User> result = userRepository.findAll(
                userSpecification(
                        search,
                        parseEnum(status, AccountStatus.class, "account status"),
                        parseEnum(role, UserRole.class, "role"),
                        collegeId,
                        emailVerified,
                        phoneVerified
                ),
                pageRequest
        );
        return page(result, result.getContent().stream().map(this::toUserItem).toList());
    }

    @Transactional(readOnly = true)
    public AdminUserDetailsResponse getUser(Long adminId, Long userId) {
        adminAccessService.requireActiveAdmin(adminId);
        User user = userRepository.findAdminUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User was not found."
                ));
        List<RecentListingItem> recentListings = listingRepository
                .findTop5BySellerIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toRecentListing)
                .toList();
        return new AdminUserDetailsResponse(
                toUserItem(user),
                user.getDepartment(),
                user.getCourse(),
                user.getYearOfStudy(),
                user.getRollNumber(),
                user.getHostelOrCampusArea(),
                reportRepository.countByReporterId(userId),
                reportRepository.countByTypeAndReportedEntityId(
                        ReportType.USER,
                        userId
                ),
                recentListings,
                auditLogRepository
                        .findTop20ByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                                "USER",
                                userId
                        )
                        .stream()
                        .map(this::toAuditLog)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminListingItem> getListings(
            Long adminId,
            String search,
            String status,
            String category,
            Long collegeId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        adminAccessService.requireActiveAdmin(adminId);
        validatePriceRange(minPrice, maxPrice);
        PageRequest pageRequest = pageRequest(
                requestedPage,
                requestedSize,
                listingSort(sortBy)
        );
        Page<Listing> result = listingRepository.findAll(
                listingSpecification(
                        search,
                        parseEnum(status, ListingStatus.class, "listing status"),
                        category,
                        collegeId,
                        minPrice,
                        maxPrice
                ),
                pageRequest
        );
        return page(
                result,
                result.getContent().stream().map(this::toListingItem).toList()
        );
    }

    @Transactional(readOnly = true)
    public AdminListingDetailsResponse getListing(Long adminId, Long listingId) {
        adminAccessService.requireActiveAdmin(adminId);
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Listing was not found."
                ));
        return new AdminListingDetailsResponse(
                toListingItem(listing),
                listing.getDescription(),
                listing.getPickupLocation(),
                listing.isNegotiable(),
                listing.getAvailableQuantity(),
                listing.getAdditionalNotes(),
                listing.getSeller().getStatus().name(),
                trustScore(listing.getSeller()),
                orderRepository.countByListingId(listingId),
                auditLogRepository
                        .findTop20ByTargetTypeAndTargetIdOrderByCreatedAtDesc(
                                "LISTING",
                                listingId
                        )
                        .stream()
                        .map(this::toAuditLog)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReviewItem> getReviews(
            Long adminId,
            Integer rating,
            String status,
            Boolean reported,
            Long collegeId,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        adminAccessService.requireActiveAdmin(adminId);
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new BadRequestException("Rating must be between 1 and 5.");
        }
        PageRequest pageRequest = pageRequest(
                requestedPage,
                requestedSize,
                basicSort(sortBy)
        );
        Page<SellerReview> result = reviewRepository.findAll(
                reviewSpecification(
                        rating,
                        parseEnum(status, ReviewStatus.class, "review status"),
                        reported,
                        collegeId
                ),
                pageRequest
        );
        return page(
                result,
                result.getContent().stream().map(this::toReviewItem).toList()
        );
    }

    @Transactional(readOnly = true)
    public AdminReviewItem getReview(Long adminId, Long reviewId) {
        adminAccessService.requireActiveAdmin(adminId);
        return toReviewItem(
                reviewRepository.findAdminReviewById(reviewId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Review was not found."
                        ))
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminOrderItem> getOrders(
            Long adminId,
            String search,
            String status,
            String paymentStatus,
            Long collegeId,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        adminAccessService.requireActiveAdmin(adminId);
        validatePriceRange(minAmount, maxAmount);
        PageRequest pageRequest = pageRequest(
                requestedPage,
                requestedSize,
                basicSort(sortBy)
        );
        Page<MarketplaceOrder> result = orderRepository.findAll(
                orderSpecification(
                        search,
                        parseEnum(status, OrderStatus.class, "order status"),
                        parseEnum(
                                paymentStatus,
                                PaymentStatus.class,
                                "payment status"
                        ),
                        collegeId,
                        minAmount,
                        maxAmount
                ),
                pageRequest
        );
        return page(
                result,
                result.getContent().stream().map(this::toOrderItem).toList()
        );
    }

    @Transactional(readOnly = true)
    public AdminOrderItem getOrder(Long adminId, Long orderId) {
        adminAccessService.requireActiveAdmin(adminId);
        return toOrderItem(
                orderRepository.findOrderDetailsById(orderId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Order was not found."
                        ))
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminPaymentItem> getPayments(
            Long adminId,
            String search,
            String status,
            String refundStatus,
            Long collegeId,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        adminAccessService.requireActiveAdmin(adminId);
        validatePriceRange(minAmount, maxAmount);
        PageRequest pageRequest = pageRequest(
                requestedPage,
                requestedSize,
                basicSort(sortBy)
        );
        Page<Payment> result = paymentRepository.findAll(
                paymentSpecification(
                        search,
                        parseEnum(status, PaymentStatus.class, "payment status"),
                        parseEnum(refundStatus, RefundStatus.class, "refund status"),
                        collegeId,
                        minAmount,
                        maxAmount
                ),
                pageRequest
        );
        return page(
                result,
                result.getContent().stream().map(this::toPaymentItem).toList()
        );
    }

    @Transactional(readOnly = true)
    public AdminPaymentItem getPayment(Long adminId, Long paymentId) {
        adminAccessService.requireActiveAdmin(adminId);
        return toPaymentItem(
                paymentRepository.findPaymentDetailsById(paymentId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Payment was not found."
                        ))
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogItem> getAuditLogs(
            Long adminId,
            String search,
            String actionType,
            String targetType,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        adminAccessService.requireActiveAdmin(adminId);
        PageRequest pageRequest = pageRequest(
                requestedPage,
                requestedSize,
                basicSort(sortBy)
        );
        Page<AdminAuditLog> result = auditLogRepository.findAll(
                auditSpecification(search, actionType, targetType),
                pageRequest
        );
        return page(
                result,
                result.getContent().stream().map(this::toAuditLog).toList()
        );
    }

    private PendingReportItem toPendingReport(Report report) {
        String targetTitle = switch (report.getType()) {
            case LISTING -> report.getListing().getTitle();
            case USER -> report.getReportedUser().getFullName();
            case REVIEW -> "Review by " + report.getReview().getReviewer().getFullName();
        };
        return new PendingReportItem(
                report.getId(),
                report.getType().name(),
                report.getReason().name(),
                report.getPriority().name(),
                targetTitle,
                report.getReporter().getFullName(),
                report.getReporter().getCollege().getName(),
                report.getCreatedAt()
        );
    }

    private RecentListingItem toRecentListing(Listing listing) {
        return new RecentListingItem(
                listing.getId(),
                listing.getTitle(),
                listing.getPrimaryImageUrl(),
                listing.getSeller().getFullName(),
                listing.getCollege().getName(),
                listing.getStatus().name(),
                listing.getPrice(),
                listing.getCreatedAt()
        );
    }

    private RecentUserItem toRecentUser(User user) {
        return new RecentUserItem(
                user.getId(),
                user.getFullName(),
                user.getCollege().getName(),
                user.isEmailVerified(),
                user.isPhoneVerified(),
                user.getStatus().name(),
                trustScore(user),
                user.getCreatedAt()
        );
    }

    private AdminUserItem toUserItem(User user) {
        return new AdminUserItem(
                user.getId(),
                user.getFullName(),
                user.getCollege().getName(),
                user.getCollege().getId(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.isPhoneVerified(),
                user.isEmailVerified(),
                user.getRole().name(),
                user.getStatus().name(),
                trustScore(user),
                roundRating(reviewRepository.averageRatingByRevieweeId(user.getId())),
                listingRepository.countBySellerIdAndStatusNot(
                        user.getId(),
                        ListingStatus.DELETED
                ),
                orderRepository.countByBuyerId(user.getId())
                        + orderRepository.countBySellerId(user.getId()),
                user.getLastLoginAt(),
                user.getCreatedAt()
        );
    }

    private AdminListingItem toListingItem(Listing listing) {
        return new AdminListingItem(
                listing.getId(),
                listing.getTitle(),
                listing.getPrimaryImageUrl(),
                listing.getSeller().getId(),
                listing.getSeller().getFullName(),
                listing.getCollege().getId(),
                listing.getCollege().getName(),
                listing.getCategory(),
                listing.getPrice(),
                listing.getCondition().name(),
                listing.getStatus().name(),
                reportRepository.countByTypeAndReportedEntityId(
                        ReportType.LISTING,
                        listing.getId()
                ),
                wishlistRepository.countByListingId(listing.getId()),
                listing.getViewCount(),
                listing.getCreatedAt()
        );
    }

    private AdminReviewItem toReviewItem(SellerReview review) {
        MarketplaceOrder order = review.getOrder();
        return new AdminReviewItem(
                review.getId(),
                review.getRating(),
                review.getMessage(),
                review.getReviewer().getId(),
                review.getReviewer().getFullName(),
                review.getReviewee().getId(),
                review.getReviewee().getFullName(),
                order.getListing().getId(),
                order.getListing().getTitle(),
                order.getId(),
                order.getOrderNumber(),
                order.getListing().getCollege().getName(),
                review.getStatus().name(),
                reportRepository.countByTypeAndReportedEntityId(
                        ReportType.REVIEW,
                        review.getId()
                ),
                review.getCreatedAt()
        );
    }

    private AdminOrderItem toOrderItem(MarketplaceOrder order) {
        return new AdminOrderItem(
                order.getId(),
                order.getOrderNumber(),
                order.getBuyer().getId(),
                order.getBuyer().getFullName(),
                order.getSeller().getId(),
                order.getSeller().getFullName(),
                order.getListing().getId(),
                order.getListing().getTitle(),
                order.getListing().getCollege().getName(),
                order.getAmount(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getPickupLocation(),
                order.getPaidAt(),
                order.getCompletedAt(),
                order.getCreatedAt()
        );
    }

    private AdminPaymentItem toPaymentItem(Payment payment) {
        return new AdminPaymentItem(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getOrder().getOrderNumber(),
                payment.getBuyer().getId(),
                payment.getBuyer().getFullName(),
                payment.getSeller().getId(),
                payment.getSeller().getFullName(),
                payment.getCollege().getName(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus().name(),
                payment.getRefundStatus().name(),
                payment.getRazorpayOrderId(),
                payment.getRazorpayPaymentId(),
                payment.getPaymentMethod(),
                payment.getFailureReason(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }

    private AuditLogItem toAuditLog(AdminAuditLog log) {
        return new AuditLogItem(
                log.getId(),
                log.getAdmin().getId(),
                log.getAdmin().getFullName(),
                log.getActionType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getPreviousValue(),
                log.getNewValue(),
                log.getNote(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCreatedAt()
        );
    }

    private Specification<User> userSpecification(
            String search,
            AccountStatus status,
            UserRole role,
            Long collegeId,
            Boolean emailVerified,
            Boolean phoneVerified
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (role != null) {
                predicates.add(builder.equal(root.get("role"), role));
            }
            if (collegeId != null) {
                predicates.add(builder.equal(root.get("college").get("id"), collegeId));
            }
            if (emailVerified != null) {
                predicates.add(builder.equal(root.get("emailVerified"), emailVerified));
            }
            if (phoneVerified != null) {
                predicates.add(builder.equal(root.get("phoneVerified"), phoneVerified));
            }
            String term = normalizeSearch(search);
            if (term != null) {
                String like = "%" + term + "%";
                List<Predicate> searchPredicates = new ArrayList<>(List.of(
                        builder.like(builder.lower(root.get("fullName")), like),
                        builder.like(builder.lower(root.get("email")), like),
                        builder.like(builder.lower(root.get("phoneNumber")), like),
                        builder.like(
                                builder.lower(root.get("college").get("name")),
                                like
                        )
                ));
                parseLong(term).ifPresent(id -> searchPredicates.add(
                        builder.equal(root.get("id"), id)
                ));
                predicates.add(builder.or(
                        searchPredicates.toArray(Predicate[]::new)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Listing> listingSpecification(
            String search,
            ListingStatus status,
            String category,
            Long collegeId,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(builder.equal(
                        builder.lower(root.get("category")),
                        category.trim().toLowerCase(Locale.ROOT)
                ));
            }
            if (collegeId != null) {
                predicates.add(builder.equal(root.get("college").get("id"), collegeId));
            }
            if (minPrice != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            String term = normalizeSearch(search);
            if (term != null) {
                String like = "%" + term + "%";
                List<Predicate> searchPredicates = new ArrayList<>(List.of(
                        builder.like(builder.lower(root.get("title")), like),
                        builder.like(
                                builder.lower(root.get("seller").get("fullName")),
                                like
                        ),
                        builder.like(
                                builder.lower(root.get("college").get("name")),
                                like
                        ),
                        builder.like(builder.lower(root.get("category")), like)
                ));
                parseLong(term).ifPresent(id -> searchPredicates.add(
                        builder.equal(root.get("id"), id)
                ));
                predicates.add(builder.or(
                        searchPredicates.toArray(Predicate[]::new)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<SellerReview> reviewSpecification(
            Integer rating,
            ReviewStatus status,
            Boolean reported,
            Long collegeId
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (rating != null) {
                predicates.add(builder.equal(root.get("rating"), rating));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (collegeId != null) {
                predicates.add(builder.equal(
                        root.get("order").get("listing").get("college").get("id"),
                        collegeId
                ));
            }
            if (reported != null) {
                Subquery<Long> reports = query.subquery(Long.class);
                var reportRoot = reports.from(Report.class);
                reports.select(builder.literal(1L)).where(
                        builder.equal(reportRoot.get("type"), ReportType.REVIEW),
                        builder.equal(
                                reportRoot.get("reportedEntityId"),
                                root.get("id")
                        )
                );
                predicates.add(reported
                        ? builder.exists(reports)
                        : builder.not(builder.exists(reports)));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<MarketplaceOrder> orderSpecification(
            String search,
            OrderStatus status,
            PaymentStatus paymentStatus,
            Long collegeId,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (paymentStatus != null) {
                predicates.add(builder.equal(root.get("paymentStatus"), paymentStatus));
            }
            if (collegeId != null) {
                predicates.add(builder.equal(
                        root.get("listing").get("college").get("id"),
                        collegeId
                ));
            }
            addRange(predicates, builder, root.get("amount"), minAmount, maxAmount);
            String term = normalizeSearch(search);
            if (term != null) {
                String like = "%" + term + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("orderNumber")), like),
                        builder.like(
                                builder.lower(root.get("buyer").get("fullName")),
                                like
                        ),
                        builder.like(
                                builder.lower(root.get("seller").get("fullName")),
                                like
                        ),
                        builder.like(
                                builder.lower(root.get("listing").get("title")),
                                like
                        )
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Payment> paymentSpecification(
            String search,
            PaymentStatus status,
            RefundStatus refundStatus,
            Long collegeId,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (refundStatus != null) {
                predicates.add(builder.equal(root.get("refundStatus"), refundStatus));
            }
            if (collegeId != null) {
                predicates.add(builder.equal(root.get("college").get("id"), collegeId));
            }
            addRange(predicates, builder, root.get("amount"), minAmount, maxAmount);
            String term = normalizeSearch(search);
            if (term != null) {
                String like = "%" + term + "%";
                predicates.add(builder.or(
                        builder.like(
                                builder.lower(root.get("order").get("orderNumber")),
                                like
                        ),
                        builder.like(
                                builder.lower(root.get("buyer").get("fullName")),
                                like
                        ),
                        builder.like(
                                builder.lower(root.get("seller").get("fullName")),
                                like
                        ),
                        builder.like(builder.lower(root.get("razorpayOrderId")), like),
                        builder.like(builder.lower(root.get("razorpayPaymentId")), like)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<AdminAuditLog> auditSpecification(
            String search,
            String actionType,
            String targetType
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (actionType != null && !actionType.isBlank()) {
                predicates.add(builder.equal(
                        root.get("actionType"),
                        normalizeEnumValue(actionType)
                ));
            }
            if (targetType != null && !targetType.isBlank()) {
                predicates.add(builder.equal(
                        root.get("targetType"),
                        normalizeEnumValue(targetType)
                ));
            }
            String term = normalizeSearch(search);
            if (term != null) {
                String like = "%" + term + "%";
                predicates.add(builder.or(
                        builder.like(
                                builder.lower(root.get("admin").get("fullName")),
                                like
                        ),
                        builder.like(builder.lower(root.get("actionType")), like),
                        builder.like(builder.lower(root.get("targetType")), like),
                        builder.like(builder.lower(root.get("note")), like)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void addRange(
            List<Predicate> predicates,
            jakarta.persistence.criteria.CriteriaBuilder builder,
            jakarta.persistence.criteria.Path<BigDecimal> path,
            BigDecimal minimum,
            BigDecimal maximum
    ) {
        if (minimum != null) {
            predicates.add(builder.greaterThanOrEqualTo(path, minimum));
        }
        if (maximum != null) {
            predicates.add(builder.lessThanOrEqualTo(path, maximum));
        }
    }

    private PageRequest pageRequest(
            Integer requestedPage,
            Integer requestedSize,
            Sort sort
    ) {
        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? DEFAULT_PAGE_SIZE : requestedSize;
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException(
                    "Page must be 0 or greater and size must be between 1 and "
                            + MAX_PAGE_SIZE + "."
            );
        }
        return PageRequest.of(page, size, sort);
    }

    private Sort basicSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank()
                || sortBy.equalsIgnoreCase("newest")) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        }
        if (sortBy.equalsIgnoreCase("oldest")) {
            return Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));
        }
        throw new BadRequestException("Unsupported sort option.");
    }

    private Sort userSort(String sortBy) {
        if (sortBy != null && (sortBy.equalsIgnoreCase("trust")
                || sortBy.equalsIgnoreCase("trust-high"))) {
            return Sort.by(
                    Sort.Order.desc("trustScore.score"),
                    Sort.Order.desc("createdAt")
            );
        }
        return basicSort(sortBy);
    }

    private Sort listingSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank()
                || sortBy.equalsIgnoreCase("newest")
                || sortBy.equalsIgnoreCase("oldest")) {
            return basicSort(sortBy);
        }
        return switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "price-high" -> Sort.by(
                    Sort.Order.desc("price"),
                    Sort.Order.desc("createdAt")
            );
            case "price-low" -> Sort.by(
                    Sort.Order.asc("price"),
                    Sort.Order.desc("createdAt")
            );
            case "most-viewed" -> Sort.by(
                    Sort.Order.desc("viewCount"),
                    Sort.Order.desc("createdAt")
            );
            default -> throw new BadRequestException(
                    "Unsupported listing sort option."
            );
        };
    }

    private <T> PageResponse<T> page(Page<?> page, List<T> items) {
        return new PageResponse<>(
                items,
                new Pagination(
                        page.getNumber(),
                        page.getSize(),
                        page.getTotalElements(),
                        page.getTotalPages(),
                        page.hasNext()
                )
        );
    }

    private <T extends Enum<T>> T parseEnum(
            String value,
            Class<T> enumType,
            String label
    ) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return Enum.valueOf(enumType, normalizeEnumValue(value));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported " + label + ".");
        }
    }

    private String normalizeEnumValue(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        return value.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String normalized = search.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() > 160) {
            throw new BadRequestException(
                    "Search text must be 160 characters or fewer."
            );
        }
        return normalized;
    }

    private java.util.Optional<Long> parseLong(String value) {
        try {
            return java.util.Optional.of(Long.parseLong(value));
        } catch (NumberFormatException ignored) {
            return java.util.Optional.empty();
        }
    }

    private int trustScore(User user) {
        return user.getTrustScore() == null ? 0 : user.getTrustScore().getScore();
    }

    private double roundRating(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private void validatePriceRange(BigDecimal minimum, BigDecimal maximum) {
        if (minimum != null && minimum.signum() < 0
                || maximum != null && maximum.signum() < 0) {
            throw new BadRequestException("Amount filters cannot be negative.");
        }
        if (minimum != null && maximum != null
                && minimum.compareTo(maximum) > 0) {
            throw new BadRequestException(
                    "Minimum amount cannot exceed maximum amount."
            );
        }
    }
}
