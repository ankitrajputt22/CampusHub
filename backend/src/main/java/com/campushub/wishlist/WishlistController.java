package com.campushub.wishlist;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import com.campushub.wishlist.dto.WishlistCountResponse;
import com.campushub.wishlist.dto.WishlistPageResponse;
import com.campushub.wishlist.dto.WishlistStatusResponse;
import java.math.BigDecimal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ApiResponse<WishlistPageResponse> getWishlist(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer minSellerTrust,
            @RequestParam(required = false) String savedDate,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Wishlist loaded successfully",
                wishlistService.getWishlist(
                        userId(authenticatedUser),
                        search,
                        category,
                        minPrice,
                        maxPrice,
                        condition,
                        status,
                        minSellerTrust,
                        savedDate,
                        sortBy,
                        page,
                        size
                )
        );
    }

    @GetMapping("/count")
    public ApiResponse<WishlistCountResponse> getCount(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Wishlist count loaded successfully",
                wishlistService.getCount(userId(authenticatedUser))
        );
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
