package com.campushub.listing.image;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface ListingImageStorage {

    StoredListingImage store(Long listingId, MultipartFile file);

    Resource load(String fileName);

    String contentType(String fileName);

    void delete(String fileName);
}
