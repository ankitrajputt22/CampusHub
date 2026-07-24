package com.campushub.auth.repository;

import com.campushub.auth.model.RefreshToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken token set token.revoked = true where token.user.id = :userId and token.revoked = false")
    int revokeAllByUserId(@Param("userId") Long userId);
}
