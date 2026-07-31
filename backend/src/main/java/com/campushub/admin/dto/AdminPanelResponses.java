package com.campushub.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AdminPanelResponses {

    private AdminPanelResponses() {
    }

    public record Pagination(
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean hasMore
    ) {
    }

    public record PageResponse<T>(
            List<T> items,
            Pagination pagination
    ) {
    }

    public record DashboardStats(
            long totalUsers,
            long activeUsers,
            long totalListings,
            long activeListings,
            long totalOrders,
            long pendingReports,
            long blockedListings,
            long totalReviews
    ) {
    }

    public record PendingReportItem(
            Long id,
            String type,
            String reason,
            String priority,
            String targetTitle,
            String reporterName,
            String reporterCollege,
            Instant createdAt
    ) {
    }

    public record RecentListingItem(
            Long id,
            String title,
            String imageUrl,
            String sellerName,
            String collegeName,
            String status,
            BigDecimal price,
            Instant createdAt
    ) {
    }

    public record RecentUserItem(
            Long id,
            String fullName,
            String collegeName,
            boolean emailVerified,
            boolean phoneVerified,
            String accountStatus,
            int trustScore,
            Instant createdAt
    ) {
    }

    public record OrderPaymentSummary(
            long totalOrders,
            long completedOrders,
            long successfulPayments,
            long failedPayments,
            long pendingPayments
    ) {
    }

    public record AuditLogItem(
            Long id,
            Long adminId,
            String adminName,
            String actionType,
            String targetType,
            Long targetId,
            String previousValue,
            String newValue,
            String note,
            String ipAddress,
            String userAgent,
            Instant createdAt
    ) {
    }

    public record AdminDashboardResponse(
            DashboardStats stats,
            List<PendingReportItem> pendingReports,
            List<RecentListingItem> recentListings,
            List<RecentUserItem> recentUsers,
            OrderPaymentSummary orderPaymentSummary,
            List<AuditLogItem> moderationActivity
    ) {
    }

    public record AdminUserItem(
            Long id,
            String fullName,
            String collegeName,
            Long collegeId,
            String collegeEmail,
            String phoneNumber,
            boolean phoneVerified,
            boolean emailVerified,
            String role,
            String accountStatus,
            int trustScore,
            double averageRating,
            long totalListings,
            long totalOrders,
            Instant lastLoginAt,
            Instant createdAt
    ) {
    }

    public record AdminUserDetailsResponse(
            AdminUserItem user,
            String department,
            String course,
            String yearOfStudy,
            String rollNumber,
            String campusArea,
            long reportsSubmitted,
            long reportsReceived,
            List<RecentListingItem> recentListings,
            List<AuditLogItem> moderationHistory
    ) {
    }

    public record AdminListingItem(
            Long id,
            String title,
            String imageUrl,
            Long sellerId,
            String sellerName,
            Long collegeId,
            String collegeName,
            String category,
            BigDecimal price,
            String condition,
            String status,
            long reportCount,
            long wishlistCount,
            long views,
            Instant createdAt
    ) {
    }

    public record AdminListingDetailsResponse(
            AdminListingItem listing,
            String description,
            String pickupLocation,
            boolean negotiable,
            int availableQuantity,
            String additionalNotes,
            String sellerStatus,
            int sellerTrustScore,
            long linkedOrders,
            List<AuditLogItem> moderationHistory
    ) {
    }

    public record AdminReviewItem(
            Long id,
            int rating,
            String comment,
            Long buyerId,
            String buyerName,
            Long sellerId,
            String sellerName,
            Long listingId,
            String listingTitle,
            Long orderId,
            String orderNumber,
            String collegeName,
            String status,
            long reportCount,
            Instant createdAt
    ) {
    }

    public record AdminOrderItem(
            Long id,
            String orderNumber,
            Long buyerId,
            String buyerName,
            Long sellerId,
            String sellerName,
            Long listingId,
            String listingTitle,
            String collegeName,
            BigDecimal amount,
            String orderStatus,
            String paymentStatus,
            String pickupLocation,
            Instant paidAt,
            Instant completedAt,
            Instant createdAt
    ) {
    }

    public record AdminPaymentItem(
            Long id,
            Long orderId,
            String orderNumber,
            Long buyerId,
            String buyerName,
            Long sellerId,
            String sellerName,
            String collegeName,
            BigDecimal amount,
            String currency,
            String paymentStatus,
            String refundStatus,
            String razorpayOrderId,
            String razorpayPaymentId,
            String paymentMethod,
            String failureReason,
            Instant paidAt,
            Instant createdAt
    ) {
    }
}
