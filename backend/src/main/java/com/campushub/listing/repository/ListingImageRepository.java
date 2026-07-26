package com.campushub.listing.repository;

import com.campushub.listing.model.ListingImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListingImageRepository extends JpaRepository<ListingImage, Long> {

    List<ListingImage> findAllByListingIdOrderByDisplayOrderAsc(Long listingId);
}
