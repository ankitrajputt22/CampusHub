package com.campushub.listing.repository;

import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    long countBySellerIdAndStatus(Long sellerId, ListingStatus status);

    @EntityGraph(attributePaths = "seller")
    List<Listing> findTop8ByCollegeIdAndStatusOrderByCreatedAtDesc(
            Long collegeId,
            ListingStatus status
    );
}
