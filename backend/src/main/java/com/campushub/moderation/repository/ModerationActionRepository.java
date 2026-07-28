package com.campushub.moderation.repository;

import com.campushub.moderation.model.ModerationAction;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModerationActionRepository extends JpaRepository<ModerationAction, Long> {

    @EntityGraph(attributePaths = "moderator")
    List<ModerationAction> findAllByReportIdOrderByCreatedAtAsc(Long reportId);
}
