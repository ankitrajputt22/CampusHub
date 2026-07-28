package com.campushub.auth.repository;

import com.campushub.auth.model.PasswordResetChallenge;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetChallengeRepository
        extends JpaRepository<PasswordResetChallenge, Long> {

    @EntityGraph(attributePaths = {"user", "user.college"})
    Optional<PasswordResetChallenge> findByPublicId(String publicId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update PasswordResetChallenge challenge
            set challenge.usedAt = :invalidatedAt,
                challenge.resetTokenHash = null,
                challenge.resetTokenExpiresAt = null
            where challenge.user.id = :userId
              and challenge.usedAt is null
            """)
    int invalidateActiveChallenges(
            @Param("userId") Long userId,
            @Param("invalidatedAt") Instant invalidatedAt
    );
}
