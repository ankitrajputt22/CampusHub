package com.campushub.review;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.review.dto.ReviewSubmissionRequest;
import com.campushub.review.dto.ReviewWorkspaceResponse;
import com.campushub.review.dto.ReviewWorkspaceResponse.ReviewItem;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/my")
    public ApiResponse<ReviewWorkspaceResponse> getMyReviews(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Reviews loaded successfully",
                reviewService.getWorkspace(userId(authenticatedUser))
        );
    }

    @PostMapping("/orders/{orderId}")
    public ApiResponse<ReviewItem> submitReview(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long orderId,
            @Valid @RequestBody ReviewSubmissionRequest request
    ) {
        return ApiResponse.success(
                "Review submitted successfully",
                reviewService.submit(userId(authenticatedUser), orderId, request)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
