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
import com.campushub.admin.dto.AdminPanelResponses.PageResponse;
import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import java.math.BigDecimal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminPanelController {

    private final AdminPanelService adminPanelService;

    public AdminPanelController(AdminPanelService adminPanelService) {
        this.adminPanelService = adminPanelService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardResponse> dashboard(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "Admin dashboard loaded successfully",
                adminPanelService.getDashboard(userId(user))
        );
    }

    @GetMapping("/users")
    public ApiResponse<PageResponse<AdminUserItem>> users(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) Boolean emailVerified,
            @RequestParam(required = false) Boolean phoneVerified,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Users loaded successfully",
                adminPanelService.getUsers(
                        userId(user),
                        search,
                        status,
                        role,
                        collegeId,
                        emailVerified,
                        phoneVerified,
                        page,
                        size,
                        sortBy
                )
        );
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<AdminUserDetailsResponse> user(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long userId
    ) {
        return ApiResponse.success(
                "User loaded successfully",
                adminPanelService.getUser(userId(authenticatedUser), userId)
        );
    }

    @GetMapping("/listings")
    public ApiResponse<PageResponse<AdminListingItem>> listings(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Listings loaded successfully",
                adminPanelService.getListings(
                        userId(user),
                        search,
                        status,
                        category,
                        collegeId,
                        minPrice,
                        maxPrice,
                        page,
                        size,
                        sortBy
                )
        );
    }

    @GetMapping("/listings/{listingId}")
    public ApiResponse<AdminListingDetailsResponse> listing(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Listing loaded successfully",
                adminPanelService.getListing(userId(user), listingId)
        );
    }

    @GetMapping("/reviews")
    public ApiResponse<PageResponse<AdminReviewItem>> reviews(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean reported,
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Reviews loaded successfully",
                adminPanelService.getReviews(
                        userId(user),
                        rating,
                        status,
                        reported,
                        collegeId,
                        page,
                        size,
                        sortBy
                )
        );
    }

    @GetMapping("/reviews/{reviewId}")
    public ApiResponse<AdminReviewItem> review(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long reviewId
    ) {
        return ApiResponse.success(
                "Review loaded successfully",
                adminPanelService.getReview(userId(user), reviewId)
        );
    }

    @GetMapping("/orders")
    public ApiResponse<PageResponse<AdminOrderItem>> orders(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Orders loaded successfully",
                adminPanelService.getOrders(
                        userId(user),
                        search,
                        status,
                        paymentStatus,
                        collegeId,
                        minAmount,
                        maxAmount,
                        page,
                        size,
                        sortBy
                )
        );
    }

    @GetMapping("/orders/{orderId}")
    public ApiResponse<AdminOrderItem> order(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long orderId
    ) {
        return ApiResponse.success(
                "Order loaded successfully",
                adminPanelService.getOrder(userId(user), orderId)
        );
    }

    @GetMapping("/payments")
    public ApiResponse<PageResponse<AdminPaymentItem>> payments(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String refundStatus,
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Payments loaded successfully",
                adminPanelService.getPayments(
                        userId(user),
                        search,
                        status,
                        refundStatus,
                        collegeId,
                        minAmount,
                        maxAmount,
                        page,
                        size,
                        sortBy
                )
        );
    }

    @GetMapping("/payments/{paymentId}")
    public ApiResponse<AdminPaymentItem> payment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long paymentId
    ) {
        return ApiResponse.success(
                "Payment loaded successfully",
                adminPanelService.getPayment(userId(user), paymentId)
        );
    }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResponse<AuditLogItem>> auditLogs(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Audit logs loaded successfully",
                adminPanelService.getAuditLogs(
                        userId(user),
                        search,
                        actionType,
                        targetType,
                        page,
                        size,
                        sortBy
                )
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
