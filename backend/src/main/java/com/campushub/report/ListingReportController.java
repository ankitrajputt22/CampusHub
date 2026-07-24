package com.campushub.report;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.report.dto.ListingReportRequest;
import com.campushub.report.dto.ListingReportResponse;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports/listing")
public class ListingReportController {

    private final ListingReportService reportService;

    public ListingReportController(ListingReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/{listingId}")
    public ApiResponse<ListingReportResponse> report(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId,
            @Valid @RequestBody ListingReportRequest request
    ) {
        return ApiResponse.success(
                "Report submitted for admin review",
                reportService.report(userId(authenticatedUser), listingId, request)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
