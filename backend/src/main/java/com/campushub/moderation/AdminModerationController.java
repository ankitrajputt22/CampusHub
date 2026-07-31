package com.campushub.moderation;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.moderation.dto.ModerationRequest;
import com.campushub.moderation.dto.ModerationResultResponse;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminModerationController {

    private final ModerationService moderationService;

    public AdminModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @PatchMapping("/listings/{listingId}/under-review")
    public ApiResponse<ModerationResultResponse> markListingUnderReview(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long listingId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(
                moderationService.markListingUnderReview(
                        userId(user), listingId, request
                )
        );
    }

    @PatchMapping("/listings/{listingId}/block")
    public ApiResponse<ModerationResultResponse> blockListing(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long listingId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(moderationService.blockListing(userId(user), listingId, request));
    }

    @PatchMapping("/listings/{listingId}/restore")
    public ApiResponse<ModerationResultResponse> restoreListing(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long listingId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(moderationService.restoreListing(userId(user), listingId, request));
    }

    @DeleteMapping("/listings/{listingId}")
    public ApiResponse<ModerationResultResponse> deleteListing(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long listingId,
            @Valid @RequestBody(required = false) ModerationRequest request
    ) {
        ModerationRequest moderationRequest = request == null
                ? new ModerationRequest(null, null)
                : request;
        return success(
                moderationService.softDeleteListing(
                        userId(user),
                        listingId,
                        moderationRequest
                )
        );
    }

    @PatchMapping("/reviews/{reviewId}/under-review")
    public ApiResponse<ModerationResultResponse> markReviewUnderReview(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long reviewId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(
                moderationService.markReviewUnderReview(userId(user), reviewId, request)
        );
    }

    @PatchMapping("/reviews/{reviewId}/hide")
    public ApiResponse<ModerationResultResponse> hideReview(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long reviewId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(moderationService.hideReview(userId(user), reviewId, request));
    }

    @PatchMapping("/reviews/{reviewId}/restore")
    public ApiResponse<ModerationResultResponse> restoreReview(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long reviewId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(moderationService.restoreReview(userId(user), reviewId, request));
    }

    @PatchMapping("/users/{targetUserId}/warn")
    public ApiResponse<ModerationResultResponse> warnUser(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long targetUserId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(moderationService.warnUser(userId(user), targetUserId, request));
    }

    @PatchMapping("/users/{targetUserId}/suspend")
    public ApiResponse<ModerationResultResponse> suspendUser(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long targetUserId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(moderationService.suspendUser(userId(user), targetUserId, request));
    }

    @PatchMapping("/users/{targetUserId}/block")
    public ApiResponse<ModerationResultResponse> blockUser(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long targetUserId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(moderationService.blockUser(userId(user), targetUserId, request));
    }

    @PatchMapping("/users/{targetUserId}/reactivate")
    public ApiResponse<ModerationResultResponse> reactivateUser(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long targetUserId,
            @Valid @RequestBody ModerationRequest request
    ) {
        return success(
                moderationService.reactivateUser(userId(user), targetUserId, request)
        );
    }

    private ApiResponse<ModerationResultResponse> success(
            ModerationResultResponse response
    ) {
        return ApiResponse.success("Moderation action completed", response);
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
