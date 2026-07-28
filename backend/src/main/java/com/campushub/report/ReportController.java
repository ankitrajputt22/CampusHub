package com.campushub.report;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.report.dto.ReportPageResponse;
import com.campushub.report.dto.ReportPageResponse.ReportItem;
import com.campushub.report.dto.ReportSubmissionRequest;
import com.campushub.report.dto.ReportSubmissionResponse;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/listing/{listingId}")
    public ApiResponse<ReportSubmissionResponse> reportListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId,
            @Valid @RequestBody ReportSubmissionRequest request
    ) {
        return ApiResponse.success(
                "Listing report submitted for moderator review",
                reportService.reportListing(userId(authenticatedUser), listingId, request)
        );
    }

    @PostMapping("/user/{reportedUserId}")
    public ApiResponse<ReportSubmissionResponse> reportUser(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long reportedUserId,
            @Valid @RequestBody ReportSubmissionRequest request
    ) {
        return ApiResponse.success(
                "User report submitted for moderator review",
                reportService.reportUser(userId(authenticatedUser), reportedUserId, request)
        );
    }

    @PostMapping("/review/{reviewId}")
    public ApiResponse<ReportSubmissionResponse> reportReview(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReportSubmissionRequest request
    ) {
        return ApiResponse.success(
                "Review report submitted for moderator review",
                reportService.reportReview(userId(authenticatedUser), reviewId, request)
        );
    }

    @GetMapping("/my")
    public ApiResponse<ReportPageResponse> getMyReports(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy
    ) {
        return ApiResponse.success(
                "Reports loaded successfully",
                reportService.getMyReports(
                        userId(authenticatedUser), type, status, page, size, sortBy
                )
        );
    }

    @GetMapping("/my/{reportId}")
    public ApiResponse<ReportItem> getMyReport(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long reportId
    ) {
        return ApiResponse.success(
                "Report loaded successfully",
                reportService.getMyReport(userId(authenticatedUser), reportId)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
