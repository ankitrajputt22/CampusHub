package com.campushub.wishlist;

import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.wishlist.dto.WishlistStatusResponse;
import com.campushub.wishlist.model.WishlistItem;
import com.campushub.wishlist.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WishlistService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final WishlistItemRepository wishlistRepository;

    public WishlistService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            WishlistItemRepository wishlistRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.wishlistRepository = wishlistRepository;
    }

    @Transactional
    public WishlistStatusResponse add(Long authenticatedUserId, Long listingId) {
        User user = loadActiveStudent(authenticatedUserId);
        Listing listing = loadAvailableCollegeListing(user, listingId);
        if (listing.getSeller().getId().equals(user.getId())) {
            throw new ForbiddenException("You cannot add your own listing to your wishlist.");
        }
        if (!wishlistRepository.existsByUserIdAndListingId(user.getId(), listingId)) {
            wishlistRepository.save(new WishlistItem(user, listing));
        }
        return new WishlistStatusResponse(listingId, true);
    }

    @Transactional
    public WishlistStatusResponse remove(Long authenticatedUserId, Long listingId) {
        User user = loadActiveStudent(authenticatedUserId);
        wishlistRepository.findByUserIdAndListingId(user.getId(), listingId)
                .ifPresent(wishlistRepository::delete);
        return new WishlistStatusResponse(listingId, false);
    }

    private Listing loadAvailableCollegeListing(User user, Long listingId) {
        return listingRepository.findMarketplaceListingById(listingId)
                .filter(listing -> listing.getStatus() == ListingStatus.ACTIVE)
                .filter(listing -> listing.getCollege().getId().equals(user.getCollege().getId()))
                .filter(listing -> listing.getSeller().getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This listing is unavailable in your college marketplace."
                ));
    }

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student account was not found."));
        if (user.getRole() != UserRole.STUDENT || user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("An active student account is required.");
        }
        if (!user.getCollege().isActive()) {
            throw new ForbiddenException("Your college marketplace is currently unavailable.");
        }
        return user;
    }
}
