package com.campushub.auth.repository;

import com.campushub.auth.model.OtpChannel;
import com.campushub.auth.model.OtpVerification;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByUserIdAndChannelAndUsedAtIsNullOrderByCreatedAtDesc(
            Long userId,
            OtpChannel channel
    );
}
