package com.campushub.listing.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "listing_images")
public class ListingImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "storage_file_name", nullable = false, length = 255)
    private String storageFileName;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ListingImage() {
    }

    public ListingImage(
            Listing listing,
            String imageUrl,
            String storageFileName,
            int displayOrder
    ) {
        this.listing = listing;
        this.imageUrl = imageUrl;
        this.storageFileName = storageFileName;
        this.displayOrder = displayOrder;
        this.createdAt = Instant.now();
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getStorageFileName() {
        return storageFileName;
    }
}
