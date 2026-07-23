package com.campushub.user.trustscore;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustScoreRepository extends JpaRepository<TrustScore, Long> {

    Optional<TrustScore> findByUserId(Long userId);

    List<TrustScore> findAllByUserIdIn(Collection<Long> userIds);
}
