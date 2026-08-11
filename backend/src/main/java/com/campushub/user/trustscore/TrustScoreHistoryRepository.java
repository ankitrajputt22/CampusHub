package com.campushub.user.trustscore;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustScoreHistoryRepository extends JpaRepository<TrustScoreHistory, Long> {
    List<TrustScoreHistory> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);
}
