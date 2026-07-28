package com.campushub.moderation;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.moderation.dto.ModerationResultResponse;
import com.campushub.moderation.dto.ReportStatusRequest;
import com.campushub.report.dto.AdminReportDetailsResponse;
import com.campushub.report.dto.AdminReportPageResponse;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final ModerationService moderationService;

    public AdminReportController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @GetMapping
    public ApiResponse<AdminReportPageResponse> getQueue(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Moderation queue loaded successfully",
                moderationService.getQueue(
                        userId(authenticatedUser),
                        type,
                        status,
                        priority,
                        page,
                        size,
                        sortBy
                )
        );
    }

    @GetMapping("/{reportId}")
    public ApiResponse<AdminReportDetailsResponse> getReport(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long reportId
    ) {
        return ApiResponse.success(
                "Report loaded successfully",
                moderationService.getReport(userId(authenticatedUser), reportId)
        );
    }

    @PatchMapping("/{reportId}/under-review")
    public ApiResponse<ModerationResultResponse> markUnderReview(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long reportId,
            @Valid @RequestBody ReportStatusRequest request
    ) {
        return ApiResponse.success(
                "Report moved under review",
                moderationService.markUnderReview(
                        userId(authenticatedUser), reportId, request
                )
        );
    }

    @PatchMapping("/{reportId}/reject")
    public ApiResponse<ModerationResultResponse> reject(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long reportId,
            @Valid @RequestBody ReportStatusRequest request
    ) {
        return ApiResponse.success(
                "Report rejected",
                moderationService.reject(userId(authenticatedUser), reportId, request)
        );
    }

    @PatchMapping("/{reportId}/close")
    public ApiResponse<ModerationResultResponse> close(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long reportId,
            @Valid @RequestBody ReportStatusRequest request
    ) {
        return ApiResponse.success(
                "Report closed",
                moderationService.close(userId(authenticatedUser), reportId, request)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
