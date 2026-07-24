package com.campushub.wishlist.repository;

import com.campushub.wishlist.model.WishlistItem;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    long countByUserId(Long userId);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    Optional<WishlistItem> findByUserIdAndListingId(Long userId, Long listingId);

    @Query("""
            select item.listing.id
            from WishlistItem item
            where item.user.id = :userId
              and item.listing.id in :listingIds
            """)
    Set<Long> findWishlistedListingIds(
            @Param("userId") Long userId,
            @Param("listingIds") Collection<Long> listingIds
    );
}
