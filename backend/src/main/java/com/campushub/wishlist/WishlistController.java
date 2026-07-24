package com.campushub.wishlist;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import com.campushub.wishlist.dto.WishlistStatusResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @PostMapping("/{listingId}")
    public ApiResponse<WishlistStatusResponse> add(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Listing added to wishlist",
                wishlistService.add(userId(authenticatedUser), listingId)
        );
    }

    @DeleteMapping("/{listingId}")
    public ApiResponse<WishlistStatusResponse> remove(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Listing removed from wishlist",
                wishlistService.remove(userId(authenticatedUser), listingId)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
