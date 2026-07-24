package com.campushub.marketplace;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.marketplace.dto.CollegeMarketplaceResponse;
import com.campushub.marketplace.dto.ProductDetailsResponse;
import com.campushub.security.AuthenticatedUser;
import java.math.BigDecimal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/listings")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/my-college")
    public ApiResponse<CollegeMarketplaceResponse> getMyCollegeMarketplace(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String pickupLocation,
            @RequestParam(required = false) Boolean negotiable,
            @RequestParam(required = false) String postedDate,
            @RequestParam(required = false) Integer minSellerTrust,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "College marketplace loaded successfully",
                marketplaceService.getMyCollegeMarketplace(
                        userId(authenticatedUser),
                        search,
                        category,
                        minPrice,
                        maxPrice,
                        condition,
                        pickupLocation,
                        negotiable,
                        postedDate,
                        minSellerTrust,
                        sortBy,
                        page,
                        size
                )
        );
    }

    @GetMapping({"/{listingId}", "/my-college/{listingId}"})
    public ApiResponse<ProductDetailsResponse> getListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Marketplace listing loaded successfully",
                marketplaceService.getListing(userId(authenticatedUser), listingId)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
