package com.campushub.listing.image;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/listings/images")
public class ListingImageController {

    private final ListingImageStorage listingImageStorage;

    public ListingImageController(ListingImageStorage listingImageStorage) {
        this.listingImageStorage = listingImageStorage;
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> image(@PathVariable String fileName) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        listingImageStorage.contentType(fileName)
                ))
                .body(listingImageStorage.load(fileName));
    }
}
