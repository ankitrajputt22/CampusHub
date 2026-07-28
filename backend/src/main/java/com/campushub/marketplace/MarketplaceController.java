package com.campushub.marketplace;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.marketplace.dto.CollegeMarketplaceResponse;
import com.campushub.marketplace.dto.CreateListingRequest;
import com.campushub.marketplace.dto.CreatedListingResponse;
import com.campushub.marketplace.dto.ExploreMarketplaceResponse;
import com.campushub.marketplace.dto.ListingStatusUpdateResponse;
import com.campushub.marketplace.dto.MyListingDetailsResponse;
import com.campushub.marketplace.dto.MyMarketplaceResponse;
import com.campushub.marketplace.dto.MyMarketplaceResponse.SellerStats;
import com.campushub.marketplace.dto.ProductDetailsResponse;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/listings")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;
    private final ExploreMarketplaceService exploreMarketplaceService;

    public MarketplaceController(
            MarketplaceService marketplaceService,
            ExploreMarketplaceService exploreMarketplaceService
    ) {
        this.marketplaceService = marketplaceService;
        this.exploreMarketplaceService = exploreMarketplaceService;
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

    @GetMapping("/explore")
    public ApiResponse<ExploreMarketplaceResponse> exploreMarketplace(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam Long collegeId,
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
                "Cross-college marketplace loaded successfully",
                exploreMarketplaceService.exploreListings(
                        userId(authenticatedUser),
                        collegeId,
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

    @GetMapping("/explore/{listingId}")
    public ApiResponse<ProductDetailsResponse> getExploreListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Cross-college listing loaded successfully",
                exploreMarketplaceService.getListing(userId(authenticatedUser), listingId)
        );
    }

    @GetMapping("/my")
    public ApiResponse<MyMarketplaceResponse> getMyMarketplace(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String pickupLocation,
            @RequestParam(required = false) String postedDate,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ApiResponse.success(
                "Your marketplace loaded successfully",
                marketplaceService.getMyMarketplace(
                        userId(authenticatedUser),
                        search,
                        status,
                        category,
                        minPrice,
                        maxPrice,
                        condition,
                        pickupLocation,
                        postedDate,
                        sortBy,
                        page,
                        size
                )
        );
    }

    @GetMapping("/my/stats")
    public ApiResponse<SellerStats> getMyMarketplaceStats(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Seller statistics loaded successfully",
                marketplaceService.getMyMarketplaceStats(userId(authenticatedUser))
        );
    }

    @GetMapping("/my/{listingId}")
    public ApiResponse<MyListingDetailsResponse> getMyListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Your listing loaded successfully",
                marketplaceService.getMyListing(userId(authenticatedUser), listingId)
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CreatedListingResponse> createListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestPart("listing") CreateListingRequest request,
            @RequestPart("images") List<MultipartFile> images
    ) {
        return ApiResponse.success(
                "Listing created successfully",
                marketplaceService.createListing(
                        userId(authenticatedUser),
                        request,
                        images
                )
        );
    }

    @PutMapping(value = "/{listingId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MyListingDetailsResponse> updateListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId,
            @Valid @RequestPart("listing") CreateListingRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        return ApiResponse.success(
                "Listing updated successfully",
                marketplaceService.updateListing(
                        userId(authenticatedUser),
                        listingId,
                        request,
                        images
                )
        );
    }

    @PatchMapping("/{listingId}/mark-sold")
    public ApiResponse<ListingStatusUpdateResponse> markListingSold(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Listing marked as sold",
                marketplaceService.markListingSold(userId(authenticatedUser), listingId)
        );
    }

    @PatchMapping("/{listingId}/mark-inactive")
    public ApiResponse<ListingStatusUpdateResponse> markListingInactive(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Listing marked as inactive",
                marketplaceService.markListingInactive(userId(authenticatedUser), listingId)
        );
    }

    @PatchMapping("/{listingId}/reactivate")
    public ApiResponse<ListingStatusUpdateResponse> reactivateListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Listing reactivated successfully",
                marketplaceService.reactivateListing(userId(authenticatedUser), listingId)
        );
    }

    @DeleteMapping("/{listingId}")
    public ApiResponse<ListingStatusUpdateResponse> deleteListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Listing deleted successfully",
                marketplaceService.deleteListing(userId(authenticatedUser), listingId)
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
