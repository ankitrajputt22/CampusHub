package com.campushub.payment.repository;

import com.campushub.payment.model.Payment;
import com.campushub.order.model.PaymentStatus;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
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

public interface PaymentRepository
        extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"order", "buyer", "seller", "listing", "college"})
    @Query("select payment from Payment payment where payment.order.id = :orderId")
    Optional<Payment> findByOrderIdForUpdate(@Param("orderId") Long orderId);

    @EntityGraph(attributePaths = {"order", "buyer", "seller", "listing", "college"})
    Optional<Payment> findByOrderId(Long orderId);

    @EntityGraph(attributePaths = {"order", "buyer", "seller", "listing", "college"})
    @Query("select payment from Payment payment where payment.id = :paymentId")
    Optional<Payment> findPaymentDetailsById(@Param("paymentId") Long paymentId);

    @Override
    @EntityGraph(attributePaths = {"order", "buyer", "seller", "listing", "college"})
    Page<Payment> findAll(Specification<Payment> specification, Pageable pageable);

    @Query("""
            select coalesce(sum(payment.amount), 0)
            from Payment payment
            where payment.buyer.id = :buyerId
              and payment.status = :status
            """)
    BigDecimal sumAmountByBuyerIdAndStatus(
            @Param("buyerId") Long buyerId,
            @Param("status") PaymentStatus status
    );
}
