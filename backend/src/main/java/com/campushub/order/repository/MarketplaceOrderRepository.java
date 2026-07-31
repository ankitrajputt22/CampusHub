package com.campushub.order.repository;

import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;

public interface MarketplaceOrderRepository
        extends JpaRepository<MarketplaceOrder, Long>,
        JpaSpecificationExecutor<MarketplaceOrder> {

    long countByBuyerId(Long buyerId);

    long countByBuyerIdAndStatus(Long buyerId, OrderStatus status);

    long countBySellerIdAndStatus(Long sellerId, OrderStatus status);

    long countBySellerId(Long sellerId);

    long countByStatus(OrderStatus status);

    long countByListingId(Long listingId);

    boolean existsByListingIdAndStatus(Long listingId, OrderStatus status);

    @Override
    @EntityGraph(attributePaths = {"listing", "listing.college", "buyer", "seller"})
    Page<MarketplaceOrder> findAll(
            Specification<MarketplaceOrder> specification,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"listing", "listing.college", "buyer", "seller"})
    @Query("select orders from MarketplaceOrder orders where orders.id = :orderId")
    Optional<MarketplaceOrder> findOrderDetailsById(@Param("orderId") Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"listing", "listing.college", "buyer", "seller"})
    @Query("select orders from MarketplaceOrder orders where orders.id = :orderId")
    Optional<MarketplaceOrder> findOrderForUpdate(@Param("orderId") Long orderId);

    @EntityGraph(attributePaths = {"listing", "buyer", "seller"})
    @Query("""
            select orders
            from MarketplaceOrder orders
            where orders.buyer.id = :buyerId
              and orders.status = com.campushub.order.model.OrderStatus.COMPLETED
              and not exists (
                  select review.id
                  from SellerReview review
                  where review.order.id = orders.id
              )
            order by orders.completedAt desc, orders.id desc
            """)
    List<MarketplaceOrder> findPendingReviewOrders(
            @Param("buyerId") Long buyerId
    );
}
