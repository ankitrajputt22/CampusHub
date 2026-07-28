package com.campushub.notification;

import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.notification.dto.NotificationPageResponse;
import com.campushub.notification.dto.NotificationPageResponse.NotificationItem;
import com.campushub.notification.dto.NotificationPageResponse.NotificationStats;
import com.campushub.notification.dto.NotificationPageResponse.PaginationSummary;
import com.campushub.notification.dto.NotificationPreviewResponse;
import com.campushub.notification.dto.NotificationReadResponse;
import com.campushub.notification.dto.NotificationUnreadCountResponse;
import com.campushub.notification.dto.NotificationsMarkedReadResponse;
import com.campushub.notification.model.Notification;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.notification.repository.NotificationRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.wishlist.repository.WishlistItemRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 50;
    private static final Set<NotificationType> SYSTEM_TYPES = Set.of(
            NotificationType.SYSTEM,
            NotificationType.SECURITY,
            NotificationType.ADMIN,
            NotificationType.ACCOUNT
    );

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final WishlistItemRepository wishlistRepository;

    public NotificationService(
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            WishlistItemRepository wishlistRepository
    ) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.wishlistRepository = wishlistRepository;
    }

    @Transactional(readOnly = true)
    public NotificationPageResponse getNotifications(
            Long authenticatedUserId,
            String type,
            Boolean isRead,
            String priority,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? DEFAULT_PAGE_SIZE : requestedSize;
        validatePage(page, size);
        List<NotificationType> types = parseTypes(type);
        NotificationPriority parsedPriority = parsePriority(priority);
        Specification<Notification> specification = specification(
                user.getId(),
                types,
                isRead,
                parsedPriority
        );
        Page<Notification> result = notificationRepository.findAll(
                specification,
                PageRequest.of(page, size, parseSort(sortBy))
        );
        return new NotificationPageResponse(
                stats(user.getId()),
                result.getContent().stream().map(this::toItem).toList(),
                new PaginationSummary(
                        result.getNumber(),
                        result.getSize(),
                        result.getTotalElements(),
                        result.getTotalPages(),
                        result.hasNext()
                )
        );
    }

    @Transactional(readOnly = true)
    public NotificationPreviewResponse getPreview(
            Long authenticatedUserId,
            Integer requestedSize
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        int size = requestedSize == null ? 5 : requestedSize;
        if (size < 1 || size > 5) {
            throw new BadRequestException("Notification preview size must be between 1 and 5.");
        }
        Page<Notification> result = notificationRepository.findAll(
                specification(user.getId(), List.of(), null, null),
                PageRequest.of(
                        0,
                        size,
                        Sort.by(
                                Sort.Order.desc("createdAt"),
                                Sort.Order.desc("id")
                        )
                )
        );
        return new NotificationPreviewResponse(
                notificationRepository.countByUserIdAndReadFalse(user.getId()),
                result.getContent().stream().map(this::toItem).toList()
        );
    }

    @Transactional(readOnly = true)
    public NotificationUnreadCountResponse getUnreadCount(Long authenticatedUserId) {
        User user = loadActiveStudent(authenticatedUserId);
        return new NotificationUnreadCountResponse(
                notificationRepository.countByUserIdAndReadFalse(user.getId())
        );
    }

    @Transactional
    public NotificationReadResponse markRead(
            Long authenticatedUserId,
            Long notificationId
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification was not found."
                ));
        notification.markRead();
        notificationRepository.save(notification);
        return new NotificationReadResponse(
                notification.getId(),
                notification.isRead(),
                notification.getReadAt(),
                notificationRepository.countByUserIdAndReadFalse(user.getId())
        );
    }

    @Transactional
    public NotificationsMarkedReadResponse markAllRead(Long authenticatedUserId) {
        User user = loadActiveStudent(authenticatedUserId);
        Instant markedAt = Instant.now();
        int updated = notificationRepository.markAllRead(user.getId(), markedAt);
        return new NotificationsMarkedReadResponse(updated, 0, markedAt);
    }

    @Transactional
    public Notification notify(
            User recipient,
            NotificationType type,
            NotificationPriority priority,
            String title,
            String message,
            RelatedEntityType relatedEntityType,
            Long relatedEntityId,
            String actionUrl
    ) {
        if (recipient == null || recipient.getId() == null) {
            throw new IllegalArgumentException("Notification recipient is required.");
        }
        return notificationRepository.save(new Notification(
                recipient,
                type,
                priority,
                safeText(title, 160, "Notification"),
                safeText(message, 1000, "An important Campus Hub update is available."),
                relatedEntityType == null ? RelatedEntityType.NONE : relatedEntityType,
                relatedEntityId,
                safeActionUrl(actionUrl)
        ));
    }

    @Transactional
    public void notifyWishlistUnavailable(Listing listing, boolean sold) {
        wishlistRepository.findAllByListingId(listing.getId()).stream()
                .filter(item -> !item.getUser().getId().equals(
                        listing.getSeller().getId()
                ))
                .forEach(item -> notify(
                        item.getUser(),
                        NotificationType.WISHLIST,
                        NotificationPriority.MEDIUM,
                        sold ? "Wishlist item sold" : "Wishlist item unavailable",
                        sold
                                ? listing.getTitle()
                                + " from your wishlist has been sold."
                                : listing.getTitle()
                                + " from your wishlist is no longer available.",
                        RelatedEntityType.LISTING,
                        listing.getId(),
                        "/student/wishlist"
                ));
    }

    private NotificationStats stats(Long userId) {
        return new NotificationStats(
                notificationRepository.countByUserId(userId),
                notificationRepository.countByUserIdAndReadFalse(userId),
                notificationRepository.countByUserIdAndType(
                        userId,
                        NotificationType.ORDER
                ),
                notificationRepository.countByUserIdAndType(
                        userId,
                        NotificationType.PAYMENT
                ),
                notificationRepository.countByUserIdAndType(
                        userId,
                        NotificationType.REVIEW
                ),
                notificationRepository.countByUserIdAndTypeIn(
                        userId,
                        SYSTEM_TYPES
                )
        );
    }

    private Specification<Notification> specification(
            Long userId,
            List<NotificationType> types,
            Boolean isRead,
            NotificationPriority priority
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("user").get("id"), userId));
            if (!types.isEmpty()) {
                predicates.add(root.get("type").in(types));
            }
            if (isRead != null) {
                predicates.add(builder.equal(root.get("read"), isRead));
            }
            if (priority != null) {
                predicates.add(builder.equal(root.get("priority"), priority));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private List<NotificationType> parseTypes(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return List.of();
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if ("SYSTEM".equals(normalized)) {
            return List.copyOf(SYSTEM_TYPES);
        }
        try {
            return List.of(NotificationType.valueOf(normalized));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported notification type.");
        }
    }

    private NotificationPriority parsePriority(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return NotificationPriority.valueOf(
                    value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported notification priority.");
        }
    }

    private Sort parseSort(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("newest")) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        }
        if (value.equalsIgnoreCase("oldest")) {
            return Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));
        }
        throw new BadRequestException("Unsupported notification sort option.");
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException(
                    "Page must be 0 or greater and size must be between 1 and "
                            + MAX_PAGE_SIZE + "."
            );
        }
    }

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student account was not found."
                ));
        if (user.getRole() != UserRole.STUDENT
                || user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException(
                    "An active student account is required to access notifications."
            );
        }
        return user;
    }

    private NotificationItem toItem(Notification notification) {
        return new NotificationItem(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType().name(),
                notification.getPriority().name(),
                notification.getRelatedEntityType().name(),
                notification.getRelatedEntityId(),
                safeActionUrl(notification.getActionUrl()),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }

    private String safeText(String value, int maxLength, String fallback) {
        String safe = value == null
                ? fallback
                : value.trim().replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");
        if (safe.isBlank()) {
            safe = fallback;
        }
        return safe.substring(0, Math.min(maxLength, safe.length()));
    }

    private String safeActionUrl(String actionUrl) {
        if (actionUrl == null || actionUrl.isBlank()) {
            return null;
        }
        String value = actionUrl.trim();
        if (value.matches("^/student/orders/\\d+$")
                || value.matches("^/listing/\\d+$")
                || value.equals("/student/reviews")
                || value.equals("/student/payments")
                || value.equals("/student/profile")
                || value.equals("/student/wishlist")
                || value.equals("/student/my-marketplace")
                || value.equals("/student/reports")
                || value.equals("/student/notifications")) {
            return value;
        }
        throw new IllegalArgumentException("Notification action URL is not allowed.");
    }
}
