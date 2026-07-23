package com.campushub.wishlist.repository;

import com.campushub.wishlist.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    long countByUserId(Long userId);
}
