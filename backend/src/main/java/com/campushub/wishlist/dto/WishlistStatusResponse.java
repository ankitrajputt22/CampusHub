package com.campushub.wishlist.dto;

public record WishlistStatusResponse(
        Long listingId,
        boolean wishlisted
) {
}
