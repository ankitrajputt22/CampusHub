package com.campushub.dashboard;

import com.campushub.activity.model.UserActivity;
import com.campushub.activity.repository.UserActivityRepository;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.dashboard.dto.StudentDashboardResponse;
import com.campushub.dashboard.dto.StudentDashboardResponse.ActivitySummary;
import com.campushub.dashboard.dto.StudentDashboardResponse.DashboardStats;
import com.campushub.dashboard.dto.StudentDashboardResponse.ListingSummary;
import com.campushub.dashboard.dto.StudentDashboardResponse.NotificationSummary;
import com.campushub.dashboard.dto.StudentDashboardResponse.ProfileCompletionSummary;
import com.campushub.dashboard.dto.StudentDashboardResponse.TrustScoreSummary;
import com.campushub.dashboard.dto.StudentDashboardResponse.UserSummary;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.notification.model.Notification;
import com.campushub.notification.repository.NotificationRepository;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import com.campushub.wishlist.repository.WishlistItemRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentDashboardService {

    private static final int PROFILE_FIELD_COUNT = 10;

    private final UserRepository userRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final ListingRepository listingRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository activityRepository;

    public StudentDashboardService(
            UserRepository userRepository,
            TrustScoreRepository trustScoreRepository,
            ListingRepository listingRepository,
            WishlistItemRepository wishlistItemRepository,
            MarketplaceOrderRepository orderRepository,
            NotificationRepository notificationRepository,
            UserActivityRepository activityRepository
    ) {
        this.userRepository = userRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.listingRepository = listingRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.orderRepository = orderRepository;
        this.notificationRepository = notificationRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional(readOnly = true)
    public StudentDashboardResponse getDashboard(Long authenticatedUserId) {
        User user = userRepository.findDashboardUserById(authenticatedUserId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated account is no longer available."));
        validateDashboardAccess(user);

        Long userId = user.getId();
        Long collegeId = user.getCollege().getId();
        ProfileCompletionSummary profileCompletion = calculateProfileCompletion(user);
        int trustScore = trustScoreRepository.findByUserId(userId)
                .map(TrustScore::getScore)
                .orElse(0);

        DashboardStats stats = new DashboardStats(
                listingRepository.countBySellerIdAndStatus(userId, ListingStatus.ACTIVE),
                wishlistItemRepository.countByUserId(userId),
                orderRepository.countByBuyerId(userId),
                orderRepository.countBySellerIdAndStatus(userId, OrderStatus.COMPLETED),
                notificationRepository.countByUserIdAndReadFalse(userId)
        );

        List<Listing> listings = listingRepository
                .findTop8ByCollegeIdAndStatusOrderByCreatedAtDesc(collegeId, ListingStatus.ACTIVE);
        Map<Long, Integer> sellerTrustScores = loadSellerTrustScores(listings);

        return new StudentDashboardResponse(
                mapUser(user),
                new TrustScoreSummary(
                        trustScore,
                        trustLevel(trustScore),
                        trustSuggestions(profileCompletion, trustScore, stats)
                ),
                profileCompletion,
                stats,
                listings.stream()
                        .map(listing -> mapListing(listing, sellerTrustScores))
                        .toList(),
                notificationRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(this::mapNotification)
                        .toList(),
                activityRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(this::mapActivity)
                        .toList(),
                Instant.now()
        );
    }

    private void validateDashboardAccess(User user) {
        if (user.getRole() != UserRole.STUDENT) {
            throw new ForbiddenException("This dashboard is available only to student accounts.");
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new UnauthorizedException("Your account is not active.");
        }
        if (!user.isEmailVerified() || !user.isPhoneVerified()) {
            throw new UnauthorizedException("Email and phone verification are required.");
        }
    }

    private UserSummary mapUser(User user) {
        return new UserSummary(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getCollege().getId(),
                user.getCollege().getName(),
                user.getCollege().getCode(),
                user.getRole().name(),
                user.getStatus().name(),
                user.isEmailVerified(),
                user.isPhoneVerified(),
                effectiveValue(user.getDepartment(), user.getCustomDepartment()),
                effectiveValue(user.getCourse(), user.getCustomCourse()),
                effectiveValue(user.getYearOfStudy(), user.getCustomYearOfStudy()),
                user.getHostelOrCampusArea(),
                user.getProfilePhotoFileName()
        );
    }

    private Map<Long, Integer> loadSellerTrustScores(List<Listing> listings) {
        Set<Long> sellerIds = listings.stream()
                .map(listing -> listing.getSeller().getId())
                .collect(Collectors.toSet());
        if (sellerIds.isEmpty()) {
            return Map.of();
        }

        return trustScoreRepository.findAllByUserIdIn(sellerIds).stream()
                .collect(Collectors.toMap(score -> score.getUser().getId(), TrustScore::getScore));
    }

    private ListingSummary mapListing(Listing listing, Map<Long, Integer> sellerTrustScores) {
        Long sellerId = listing.getSeller().getId();
        return new ListingSummary(
                listing.getId(),
                listing.getTitle(),
                listing.getPrice(),
                displayCondition(listing.getCondition().name()),
                listing.getPrimaryImageUrl(),
                sellerId,
                listing.getSeller().getFullName(),
                sellerTrustScores.getOrDefault(sellerId, 0),
                listing.getCreatedAt()
        );
    }

    private NotificationSummary mapNotification(Notification notification) {
        return new NotificationSummary(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }

    private ActivitySummary mapActivity(UserActivity activity) {
        return new ActivitySummary(
                activity.getId(),
                activity.getType().name(),
                activity.getMessage(),
                activity.getCreatedAt()
        );
    }

    private ProfileCompletionSummary calculateProfileCompletion(User user) {
        List<String> missingFields = new ArrayList<>();
        checkProfileField(missingFields, "fullName", user.getFullName(), this::hasText);
        checkProfileField(missingFields, "verifiedEmail", user.isEmailVerified(), Boolean.TRUE::equals);
        checkProfileField(missingFields, "verifiedPhone", user.isPhoneVerified(), Boolean.TRUE::equals);
        checkProfileField(
                missingFields,
                "department",
                effectiveValue(user.getDepartment(), user.getCustomDepartment()),
                this::hasText
        );
        checkProfileField(
                missingFields,
                "course",
                effectiveValue(user.getCourse(), user.getCustomCourse()),
                this::hasText
        );
        checkProfileField(
                missingFields,
                "yearOfStudy",
                effectiveValue(user.getYearOfStudy(), user.getCustomYearOfStudy()),
                this::hasText
        );
        checkProfileField(
                missingFields,
                "hostelOrCampusArea",
                user.getHostelOrCampusArea(),
                this::hasText
        );
        checkProfileField(missingFields, "profilePhoto", user.getProfilePhotoFileName(), this::hasText);
        checkProfileField(missingFields, "bio", user.getBio(), this::hasText);
        boolean hasSocialProfile = hasText(user.getLinkedinUrl()) || hasText(user.getGithubUrl());
        checkProfileField(missingFields, "linkedinOrGithub", hasSocialProfile, Boolean.TRUE::equals);

        int completedFields = PROFILE_FIELD_COUNT - missingFields.size();
        return new ProfileCompletionSummary(
                completedFields * 100 / PROFILE_FIELD_COUNT,
                completedFields,
                PROFILE_FIELD_COUNT,
                List.copyOf(missingFields)
        );
    }

    private <T> void checkProfileField(
            List<String> missingFields,
            String fieldName,
            T value,
            Predicate<T> completed
    ) {
        if (!completed.test(value)) {
            missingFields.add(fieldName);
        }
    }

    private List<String> trustSuggestions(
            ProfileCompletionSummary profile,
            int trustScore,
            DashboardStats stats
    ) {
        Set<String> suggestions = new LinkedHashSet<>();
        if (profile.missingFields().contains("profilePhoto")) {
            suggestions.add("Add a clear profile photo.");
        }
        if (profile.missingFields().contains("bio")) {
            suggestions.add("Add a short bio so other students know more about you.");
        }
        if (profile.missingFields().contains("linkedinOrGithub")) {
            suggestions.add("Connect a LinkedIn or GitHub profile.");
        }
        if (stats.ordersPlaced() == 0 && stats.itemsSold() == 0) {
            suggestions.add("Complete your first marketplace transaction.");
        }
        if (trustScore < 71) {
            suggestions.add("Keep listings accurate and communicate reliably with students.");
        }
        return suggestions.stream().limit(4).toList();
    }

    private String trustLevel(int score) {
        if (score <= 40) {
            return "New / Low Trust";
        }
        if (score <= 70) {
            return "Average Trust";
        }
        if (score <= 90) {
            return "Trusted Student";
        }
        return "Campus Verified Seller";
    }

    private String displayCondition(String condition) {
        String[] words = condition.toLowerCase().split("_");
        return java.util.Arrays.stream(words)
                .map(word -> Character.toUpperCase(word.charAt(0)) + word.substring(1))
                .collect(Collectors.joining(" "));
    }

    private String effectiveValue(String selectedValue, String customValue) {
        if ("Other".equalsIgnoreCase(selectedValue) && hasText(customValue)) {
            return customValue.trim();
        }
        return selectedValue;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
