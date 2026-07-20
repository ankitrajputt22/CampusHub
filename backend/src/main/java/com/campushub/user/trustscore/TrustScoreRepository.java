package com.campushub.user.trustscore;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustScoreRepository extends JpaRepository<TrustScore, Long> {

    Optional<TrustScore> findByUserId(Long userId);
}
