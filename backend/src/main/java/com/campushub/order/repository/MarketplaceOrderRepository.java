package com.campushub.order.repository;

import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketplaceOrderRepository extends JpaRepository<MarketplaceOrder, Long> {

    long countByBuyerId(Long buyerId);

    long countByBuyerIdAndStatus(Long buyerId, OrderStatus status);

    long countBySellerIdAndStatus(Long sellerId, OrderStatus status);

    boolean existsByListingIdAndStatus(Long listingId, OrderStatus status);
}
