package com.campushub.superadmin;

import com.campushub.college.model.CollegeStatus;
import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import com.campushub.superadmin.dto.SuperAdminDtos.AdminDetails;
import com.campushub.superadmin.dto.SuperAdminDtos.AdminItem;
import com.campushub.superadmin.dto.SuperAdminDtos.AuditLogItem;
import com.campushub.superadmin.dto.SuperAdminDtos.CategoryItem;
import com.campushub.superadmin.dto.SuperAdminDtos.CategoryRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.CollegeDetails;
import com.campushub.superadmin.dto.SuperAdminDtos.CollegeItem;
import com.campushub.superadmin.dto.SuperAdminDtos.CollegeRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.CreateAdminRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.DashboardResponse;
import com.campushub.superadmin.dto.SuperAdminDtos.PageResponse;
import com.campushub.superadmin.dto.SuperAdminDtos.PlatformSettingsResponse;
import com.campushub.superadmin.dto.SuperAdminDtos.PlatformSettingsUpdateRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.ReorderCategoriesRequest;
import com.campushub.superadmin.dto.SuperAdminDtos.SystemHealthResponse;
import com.campushub.superadmin.model.PlatformCategoryStatus;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/super-admin")
public class SuperAdminController {

    private final SuperAdminService service;

    public SuperAdminController(SuperAdminService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    public ApiResponse<DashboardResponse> dashboard(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "Super Admin dashboard loaded successfully",
                service.getDashboard(userId(user))
        );
    }

    @GetMapping("/admins")
    public ApiResponse<PageResponse<AdminItem>> admins(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Admins loaded successfully",
                service.getAdmins(userId(user), search, status, role, page, size)
        );
    }

    @PostMapping("/admins")
    public ApiResponse<AdminItem> createAdmin(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateAdminRequest request
    ) {
        return ApiResponse.success(
                "Admin created successfully.",
                service.createAdmin(userId(user), request)
        );
    }

    @GetMapping("/admins/{adminId}")
    public ApiResponse<AdminDetails> admin(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long adminId
    ) {
        return ApiResponse.success(
                "Admin loaded successfully",
                service.getAdmin(userId(user), adminId)
        );
    }

    @PatchMapping("/admins/{adminId}/suspend")
    public ApiResponse<AdminItem> suspendAdmin(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long adminId
    ) {
        return ApiResponse.success(
                "Admin suspended successfully.",
                service.suspendAdmin(userId(user), adminId)
        );
    }

    @PatchMapping("/admins/{adminId}/reactivate")
    public ApiResponse<AdminItem> reactivateAdmin(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long adminId
    ) {
        return ApiResponse.success(
                "Admin reactivated successfully.",
                service.reactivateAdmin(userId(user), adminId)
        );
    }

    @PatchMapping("/admins/{adminId}/remove-admin-role")
    public ApiResponse<AdminItem> removeAdminRole(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long adminId
    ) {
        return ApiResponse.success(
                "Admin role removed successfully.",
                service.removeAdminRole(userId(user), adminId)
        );
    }

    @GetMapping("/colleges")
    public ApiResponse<PageResponse<CollegeItem>> colleges(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Colleges loaded successfully",
                service.getColleges(userId(user), search, status, page, size)
        );
    }

    @PostMapping("/colleges")
    public ApiResponse<CollegeItem> createCollege(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CollegeRequest request
    ) {
        return ApiResponse.success(
                "College created successfully.",
                service.createCollege(userId(user), request)
        );
    }

    @GetMapping("/colleges/{collegeId}")
    public ApiResponse<CollegeDetails> college(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long collegeId
    ) {
        return ApiResponse.success(
                "College loaded successfully",
                service.getCollege(userId(user), collegeId)
        );
    }

    @PutMapping("/colleges/{collegeId}")
    public ApiResponse<CollegeItem> updateCollege(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long collegeId,
            @Valid @RequestBody CollegeRequest request
    ) {
        return ApiResponse.success(
                "College updated successfully.",
                service.updateCollege(userId(user), collegeId, request)
        );
    }

    @PatchMapping("/colleges/{collegeId}/activate")
    public ApiResponse<CollegeItem> activateCollege(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long collegeId
    ) {
        return ApiResponse.success(
                "College activated successfully.",
                service.changeCollegeStatus(userId(user), collegeId, CollegeStatus.ACTIVE)
        );
    }

    @PatchMapping("/colleges/{collegeId}/deactivate")
    public ApiResponse<CollegeItem> deactivateCollege(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long collegeId
    ) {
        return ApiResponse.success(
                "College deactivated successfully.",
                service.changeCollegeStatus(userId(user), collegeId, CollegeStatus.INACTIVE)
        );
    }

    @PatchMapping("/colleges/{collegeId}/block")
    public ApiResponse<CollegeItem> blockCollege(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long collegeId
    ) {
        return ApiResponse.success(
                "College blocked successfully.",
                service.changeCollegeStatus(userId(user), collegeId, CollegeStatus.BLOCKED)
        );
    }

    @GetMapping("/categories")
    public ApiResponse<PageResponse<CategoryItem>> categories(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Categories loaded successfully",
                service.getCategories(userId(user), search, status, page, size)
        );
    }

    @PostMapping("/categories")
    public ApiResponse<CategoryItem> createCategory(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CategoryRequest request
    ) {
        return ApiResponse.success(
                "Category created successfully.",
                service.createCategory(userId(user), request)
        );
    }

    @PutMapping("/categories/{categoryId}")
    public ApiResponse<CategoryItem> updateCategory(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryRequest request
    ) {
        return ApiResponse.success(
                "Category updated successfully.",
                service.updateCategory(userId(user), categoryId, request)
        );
    }

    @PatchMapping("/categories/{categoryId}/enable")
    public ApiResponse<CategoryItem> enableCategory(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long categoryId
    ) {
        return ApiResponse.success(
                "Category enabled successfully.",
                service.changeCategoryStatus(userId(user), categoryId, PlatformCategoryStatus.ACTIVE)
        );
    }

    @PatchMapping("/categories/{categoryId}/disable")
    public ApiResponse<CategoryItem> disableCategory(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long categoryId
    ) {
        return ApiResponse.success(
                "Category disabled successfully.",
                service.changeCategoryStatus(userId(user), categoryId, PlatformCategoryStatus.INACTIVE)
        );
    }

    @PatchMapping("/categories/reorder")
    public ApiResponse<List<CategoryItem>> reorderCategories(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ReorderCategoriesRequest request
    ) {
        return ApiResponse.success(
                "Categories reordered successfully.",
                service.reorderCategories(userId(user), request)
        );
    }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResponse<AuditLogItem>> auditLogs(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String actorRole,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Audit logs loaded successfully",
                service.getAuditLogs(userId(user), search, actorRole, actionType, targetType, page, size)
        );
    }

    @GetMapping("/platform-settings")
    public ApiResponse<PlatformSettingsResponse> platformSettings(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "Platform settings loaded successfully",
                service.getPlatformSettings(userId(user))
        );
    }

    @PutMapping("/platform-settings")
    public ApiResponse<PlatformSettingsResponse> updatePlatformSettings(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody PlatformSettingsUpdateRequest request
    ) {
        return ApiResponse.success(
                "Platform settings updated successfully.",
                service.updatePlatformSettings(userId(user), request)
        );
    }

    @GetMapping("/system-health")
    public ApiResponse<SystemHealthResponse> systemHealth(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "System health loaded successfully",
                service.getSystemHealth(userId(user))
        );
    }

    private Long userId(AuthenticatedUser user) {
        if (user == null) throw new UnauthorizedException("Authentication is required.");
        return user.userId();
    }
}
