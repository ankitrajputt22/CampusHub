package com.campushub.activity.repository;

import com.campushub.activity.model.UserActivity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    List<UserActivity> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);
}
