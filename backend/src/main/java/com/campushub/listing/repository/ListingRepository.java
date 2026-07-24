package com.campushub.listing.repository;

import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.user.model.AccountStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;

public interface ListingRepository
        extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    long countBySellerIdAndStatus(Long sellerId, ListingStatus status);

    boolean existsBySellerIdAndTitleIgnoreCase(Long sellerId, String title);

    @EntityGraph(attributePaths = "seller")
    List<Listing> findTop8ByCollegeIdAndStatusOrderByCreatedAtDesc(
            Long collegeId,
            ListingStatus status
    );

    @Override
    @EntityGraph(attributePaths = {"seller", "college"})
    Page<Listing> findAll(Specification<Listing> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"seller", "college"})
    @Query("select listing from Listing listing where listing.id = :listingId")
    Optional<Listing> findMarketplaceListingById(@Param("listingId") Long listingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"seller", "college"})
    @Query("select listing from Listing listing where listing.id = :listingId")
    Optional<Listing> findMarketplaceListingForUpdate(@Param("listingId") Long listingId);

    @EntityGraph(attributePaths = {"seller", "college"})
    List<Listing> findTop4ByCollegeIdAndCategoryIgnoreCaseAndStatusAndIdNotAndSeller_StatusOrderByCreatedAtDesc(
            Long collegeId,
            String category,
            ListingStatus status,
            Long excludedListingId,
            AccountStatus sellerStatus
    );

    @Query("""
            select distinct listing.pickupLocation
            from Listing listing
            where listing.college.id = :collegeId
              and listing.status = :status
              and listing.pickupLocation is not null
              and listing.pickupLocation <> ''
            order by listing.pickupLocation
            """)
    List<String> findPickupLocations(
            @Param("collegeId") Long collegeId,
            @Param("status") ListingStatus status
    );
}
