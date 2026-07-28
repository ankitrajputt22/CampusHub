package com.campushub.college;

import com.campushub.college.dto.CollegeSummaryResponse;
import com.campushub.college.dto.ExploreCollegeDetailsResponse;
import com.campushub.college.dto.ExploreCollegesResponse;
import com.campushub.college.service.CollegeService;
import com.campushub.college.service.ExploreCollegeService;
import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/colleges")
public class CollegeController {

    private final CollegeService collegeService;
    private final ExploreCollegeService exploreCollegeService;

    public CollegeController(
            CollegeService collegeService,
            ExploreCollegeService exploreCollegeService
    ) {
        this.collegeService = collegeService;
        this.exploreCollegeService = exploreCollegeService;
    }

    @GetMapping("/search")
    public ApiResponse<List<CollegeSummaryResponse>> searchColleges(
            @RequestParam(name = "keyword", required = false) String keyword
    ) {
        return ApiResponse.success("Colleges fetched successfully", collegeService.search(keyword));
    }

    @GetMapping("/explore")
    public ApiResponse<ExploreCollegesResponse> exploreColleges(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search
    ) {
        return ApiResponse.success(
                "Colleges available to explore fetched successfully",
                exploreCollegeService.explore(userId(authenticatedUser), search)
        );
    }

    @GetMapping("/explore/search")
    public ApiResponse<ExploreCollegesResponse> searchExploreColleges(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(
                "College search completed successfully",
                exploreCollegeService.explore(userId(authenticatedUser), keyword)
        );
    }

    @GetMapping("/explore/{collegeId}")
    public ApiResponse<ExploreCollegeDetailsResponse> getExploreCollege(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long collegeId
    ) {
        return ApiResponse.success(
                "College details fetched successfully",
                exploreCollegeService.getCollege(userId(authenticatedUser), collegeId)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
