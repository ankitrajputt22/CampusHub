package com.campushub.wishlist.repository;

import com.campushub.listing.model.ListingStatus;
import com.campushub.user.model.AccountStatus;
import com.campushub.wishlist.model.WishlistItem;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishlistItemRepository
        extends JpaRepository<WishlistItem, Long>, JpaSpecificationExecutor<WishlistItem> {

    long countByUserId(Long userId);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    Optional<WishlistItem> findByUserIdAndListingId(Long userId, Long listingId);

    long countByListingId(Long listingId);

    @EntityGraph(attributePaths = "user")
    List<WishlistItem> findAllByListingId(Long listingId);

    @Override
    @EntityGraph(attributePaths = {"listing", "listing.seller", "listing.college"})
    Page<WishlistItem> findAll(
            Specification<WishlistItem> specification,
            Pageable pageable
    );

    @Query("""
            select count(item)
            from WishlistItem item
            where item.user.id = :userId
              and item.listing.college.id = :collegeId
            """)
    long countScopedWishlistItems(
            @Param("userId") Long userId,
            @Param("collegeId") Long collegeId
    );

    @Query("""
            select count(item)
            from WishlistItem item
            where item.user.id = :userId
              and item.listing.college.id = :collegeId
              and item.listing.status = :listingStatus
              and item.listing.seller.status = :sellerStatus
            """)
    long countAvailableWishlistItems(
            @Param("userId") Long userId,
            @Param("collegeId") Long collegeId,
            @Param("listingStatus") ListingStatus listingStatus,
            @Param("sellerStatus") AccountStatus sellerStatus
    );

    @Query("""
            select count(item)
            from WishlistItem item
            where item.listing.seller.id = :sellerId
              and item.listing.status <> :excludedStatus
            """)
    long countSellerListingSaves(
            @Param("sellerId") Long sellerId,
            @Param("excludedStatus") ListingStatus excludedStatus
    );

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
