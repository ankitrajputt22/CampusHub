package com.campushub.notification.repository;

import com.campushub.notification.model.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    long countByUserIdAndReadFalse(Long userId);

    List<Notification> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);
}
