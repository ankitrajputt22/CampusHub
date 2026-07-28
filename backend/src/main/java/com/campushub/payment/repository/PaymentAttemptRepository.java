package com.campushub.payment.repository;

import com.campushub.payment.model.PaymentAttempt;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {

    long countByOrderId(Long orderId);

    Optional<PaymentAttempt> findByRazorpayOrderId(String razorpayOrderId);

    List<PaymentAttempt> findByOrderIdOrderByAttemptedAtDesc(Long orderId);
}
