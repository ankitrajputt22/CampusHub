package com.campushub.superadmin.dto;

import com.campushub.college.model.CollegeStatus;
import com.campushub.superadmin.model.PlatformCategoryStatus;
import com.campushub.superadmin.model.PlatformSettingType;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class SuperAdminDtos {

    private SuperAdminDtos() {
    }

    public record PageResponse<T>(
            List<T> items,
            Pagination pagination
    ) {
    }

    public record Pagination(
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
    }

    public record DashboardResponse(
            DashboardStats stats,
            List<AuditLogItem> recentAdminActions,
            List<CollegeItem> recentCollegeUpdates,
            List<PriorityReportItem> highPriorityReports,
            List<SupportTicketItem> openSupportTickets,
            List<String> systemAlerts
    ) {
    }

    public record DashboardStats(
            long totalStudents,
            long totalAdmins,
            long totalColleges,
            long activeListings,
            long totalOrders,
            long pendingReports,
            long openSupportTickets,
            long recentAdminActions
    ) {
    }

    public record AdminItem(
            Long id,
            String fullName,
            String email,
            String username,
            UserRole role,
            AccountStatus status,
            Instant lastLoginAt,
            Instant createdAt,
            String createdByName
    ) {
    }

    public record AdminDetails(
            AdminItem admin,
            List<AuditLogItem> recentAuditLogs,
            long moderationActionsTaken
    ) {
    }

    public record CreateAdminRequest(
            @NotBlank
            @Size(max = 120)
            String fullName,
            @NotBlank
            @Email
            @Size(max = 160)
            String email,
            @NotBlank
            @Pattern(regexp = "^[a-zA-Z0-9._-]{3,30}$")
            String username
    ) {
    }

    public record CollegeItem(
            Long id,
            String name,
            String code,
            String emailDomain,
            String city,
            String state,
            String country,
            String description,
            CollegeStatus status,
            long verifiedStudentsCount,
            long activeListingsCount,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record CollegeDetails(
            CollegeItem college,
            long totalUsers,
            long activeUsers,
            long totalOrders,
            long reportsCount,
            long supportTicketsCount,
            List<AdminItem> recentUsers,
            List<AuditLogItem> auditHistory
    ) {
    }

    public record CollegeRequest(
            @NotBlank
            @Size(max = 150)
            String collegeName,
            @NotBlank
            @Pattern(regexp = "^[A-Z0-9_-]{2,20}$")
            String collegeCode,
            @Size(max = 120)
            String emailDomain,
            @NotBlank
            @Size(max = 100)
            String city,
            @NotBlank
            @Size(max = 100)
            String state,
            @NotBlank
            @Size(max = 100)
            String country,
            @Size(max = 500)
            String description,
            CollegeStatus status
    ) {
    }

    public record CategoryItem(
            Long id,
            String name,
            String slug,
            String description,
            String iconUrl,
            PlatformCategoryStatus status,
            int sortOrder,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record CategoryRequest(
            @NotBlank
            @Size(max = 80)
            String name,
            @Size(max = 100)
            String slug,
            @Size(max = 500)
            String description,
            @Size(max = 500)
            String iconUrl,
            PlatformCategoryStatus status,
            @Min(0)
            Integer sortOrder
    ) {
    }

    public record ReorderCategoriesRequest(
            @NotNull
            List<CategoryOrderRequest> categories
    ) {
    }

    public record CategoryOrderRequest(
            @NotNull
            Long categoryId,
            @Min(0)
            int sortOrder
    ) {
    }

    public record AuditLogItem(
            Long id,
            Long actorId,
            String actorName,
            UserRole actorRole,
            String actionType,
            String targetType,
            Long targetId,
            String oldValue,
            String newValue,
            String ipAddress,
            String userAgent,
            Instant createdAt
    ) {
    }

    public record PriorityReportItem(
            Long id,
            String type,
            String status,
            String reason,
            String reporterName,
            String reporterCollege,
            Instant createdAt
    ) {
    }

    public record SupportTicketItem(
            Long id,
            String ticketNumber,
            String subject,
            String status,
            String priority,
            String submitterName,
            Instant createdAt
    ) {
    }

    public record PlatformSettingItem(
            String key,
            String value,
            PlatformSettingType type,
            String description,
            Instant updatedAt
    ) {
    }

    public record PlatformSettingsResponse(
            List<PlatformSettingItem> settings
    ) {
    }

    public record PlatformSettingsUpdateRequest(
            @NotNull
            Map<String, String> settings
    ) {
    }

    public record SystemHealthResponse(
            String backendStatus,
            String databaseStatus,
            String storageStatus,
            String paymentGatewayStatus,
            Instant checkedAt
    ) {
    }
}
