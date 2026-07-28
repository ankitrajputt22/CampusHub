package com.campushub.notification.repository;

import com.campushub.notification.model.Notification;
import com.campushub.notification.model.NotificationType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository
        extends JpaRepository<Notification, Long>,
        JpaSpecificationExecutor<Notification> {

    long countByUserIdAndReadFalse(Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndType(Long userId, NotificationType type);

    long countByUserIdAndTypeIn(Long userId, Collection<NotificationType> types);

    List<Notification> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Override
    Page<Notification> findAll(
            Specification<Notification> specification,
            Pageable pageable
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Notification notification
            set notification.read = true,
                notification.readAt = :readAt,
                notification.updatedAt = :readAt
            where notification.user.id = :userId
              and notification.read = false
            """)
    int markAllRead(
            @Param("userId") Long userId,
            @Param("readAt") Instant readAt
    );
}
