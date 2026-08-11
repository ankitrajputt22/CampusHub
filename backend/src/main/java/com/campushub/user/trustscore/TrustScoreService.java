package com.campushub.user.trustscore;

import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.moderation.model.ModerationAction;
import com.campushub.moderation.model.ModerationActionType;
import com.campushub.moderation.model.ModerationTargetType;
import com.campushub.moderation.repository.ModerationActionRepository;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.review.model.ReviewStatus;
import com.campushub.review.model.SellerReview;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrustScoreService {
    private static final EnumSet<ListingStatus> QUALITY_LISTINGS =
            EnumSet.of(ListingStatus.ACTIVE, ListingStatus.SOLD);
    private static final EnumSet<OrderStatus> COMPLETED = EnumSet.of(OrderStatus.COMPLETED);

    private final UserRepository userRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final TrustScoreHistoryRepository historyRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final SellerReviewRepository reviewRepository;
    private final ModerationActionRepository actionRepository;
    private final NotificationService notificationService;

    public TrustScoreService(
            UserRepository userRepository,
            TrustScoreRepository trustScoreRepository,
            TrustScoreHistoryRepository historyRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            SellerReviewRepository reviewRepository,
            ModerationActionRepository actionRepository,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.historyRepository = historyRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.actionRepository = actionRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public TrustScore recalculateAndSave(
            Long userId, String sourceType, Long sourceId, String reason, boolean notify
    ) {
        User user = userRepository.findChatUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        Calculation calculation = calculate(user);
        TrustScore existing = trustScoreRepository.findByUserId(userId).orElse(null);
        int before = existing == null ? 0 : existing.getScore();
        TrustScoreLevel beforeLevel = existing == null
                ? TrustScoreLevel.NEW_LOW_TRUST : existing.getLevel();
        int beforePenalty = existing == null ? 0 : existing.getPenaltyScore();
        TrustScore score = existing == null
                ? new TrustScore(user, calculation.score(), reason)
                : existing;
        score.updateCalculation(
                calculation.score(), calculation.level(), calculation.verification(),
                calculation.profile(), calculation.marketplace(), calculation.orders(),
                calculation.reviews(), calculation.security(), calculation.penalties(), reason
        );
        trustScoreRepository.save(score);
        if (existing == null || before != calculation.score()) {
            historyRepository.save(new TrustScoreHistory(
                    user, before, calculation.score(),
                    existing == null ? "INITIAL_CALCULATION" : "RECALCULATED",
                    reason, sourceType, sourceId
            ));
        }
        if (notify && existing != null
                && (beforeLevel != calculation.level() || beforePenalty < calculation.penalties())) {
            notificationService.notify(
                    user,
                    NotificationType.SYSTEM,
                    calculation.penalties() > beforePenalty
                            ? NotificationPriority.MEDIUM : NotificationPriority.LOW,
                    "Campus Trust Score updated",
                    "Your Campus Trust Score is now " + calculation.score()
                            + "/100 (" + calculation.level().getLabel() + ").",
                    RelatedEntityType.TRUST_SCORE,
                    userId,
                    "/student/profile"
            );
        }
        return score;
    }

    @Transactional
    public TrustScoreResponse getOwnScore(Long userId) {
        TrustScore score = recalculateAndSave(userId, "READ", userId, "Trust score recalculated", false);
        return response(score, userRepository.findChatUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found.")));
    }

    @Transactional(readOnly = true)
    public TrustScoreHistoryResponse getHistory(Long userId) {
        return new TrustScoreHistoryResponse(historyRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::historyEntry).toList());
    }

    @Transactional(readOnly = true)
    public TrustScoreResponse getPublicScore(Long userId) {
        User user = userRepository.findChatUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        TrustScore score = trustScoreRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trust score not found."));
        return new TrustScoreResponse(
                userId, score.getScore(), score.getLevel().name(), score.getLevel().getLabel(),
                new TrustScoreResponse.Breakdown(
                        score.getVerificationScore(), score.getProfileCompletionScore(),
                        score.getMarketplaceActivityScore(), score.getOrderCompletionScore(),
                        score.getReviewsRatingScore(), score.getAccountSecurityScore(),
                        0, score.getVerificationScore() + score.getProfileCompletionScore()
                                + score.getMarketplaceActivityScore() + score.getOrderCompletionScore()
                                + score.getReviewsRatingScore() + score.getAccountSecurityScore(), 0),
                List.of(), score.getLastCalculatedAt()
        );
    }

    @Transactional
    public TrustScoreResponse getAdminScore(Long userId) {
        User user = userRepository.findChatUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        TrustScore score = trustScoreRepository.findByUserId(userId)
                .orElseGet(() -> recalculateAndSave(userId, "ADMIN_READ", userId, "Admin requested score", false));
        return response(score, user);
    }

    private TrustScoreResponse response(TrustScore score, User user) {
        int positive = score.getVerificationScore() + score.getProfileCompletionScore()
                + score.getMarketplaceActivityScore() + score.getOrderCompletionScore()
                + score.getReviewsRatingScore() + score.getAccountSecurityScore();
        return new TrustScoreResponse(
                user.getId(), score.getScore(), score.getLevel().name(), score.getLevel().getLabel(),
                new TrustScoreResponse.Breakdown(
                        score.getVerificationScore(), score.getProfileCompletionScore(),
                        score.getMarketplaceActivityScore(), score.getOrderCompletionScore(),
                        score.getReviewsRatingScore(), score.getAccountSecurityScore(),
                        score.getPenaltyScore(), positive, score.getPenaltyScore()),
                suggestions(user, score), score.getLastCalculatedAt()
        );
    }

    private List<String> suggestions(User user, TrustScore score) {
        List<String> suggestions = new ArrayList<>();
        if (!hasText(user.getProfilePhotoUrl())) suggestions.add("Add a clear profile photo.");
        if (!hasText(user.getBio())) suggestions.add("Add a short bio to complete your profile.");
        if (!hasText(user.getLinkedinUrl()) && !hasText(user.getGithubUrl())) {
            suggestions.add("Link a professional or developer profile.");
        }
        if (score.getMarketplaceActivityScore() < 9) suggestions.add("Create complete, honest listings.");
        if (score.getOrderCompletionScore() < 10) suggestions.add("Complete marketplace orders responsibly.");
        return suggestions.stream().limit(5).toList();
    }

    private Calculation calculate(User user) {
        int verification = (user.isEmailVerified() ? 10 : 0)
                + (user.isPhoneVerified() ? 10 : 0)
                + (user.getCollege() != null ? 10 : 0);
        int profile = (hasText(user.getProfilePhotoUrl()) ? 3 : 0)
                + (hasText(user.getBio()) ? 2 : 0)
                + (hasText(user.getDepartment()) || hasText(user.getCustomDepartment()) ? 2 : 0)
                + (hasText(user.getCourse()) || hasText(user.getCustomCourse()) ? 2 : 0)
                + (hasText(user.getYearOfStudy()) || hasText(user.getCustomYearOfStudy()) ? 2 : 0)
                + (hasText(user.getHostelOrCampusArea()) ? 1 : 0)
                + (hasText(user.getLinkedinUrl()) ? 1 : 0)
                + (hasText(user.getGithubUrl()) ? 1 : 0)
                + (hasText(user.getRollNumber()) ? 1 : 0);
        long active = listingRepository.countBySellerIdAndStatus(user.getId(), ListingStatus.ACTIVE);
        long qualityCount = listingRepository.countBySellerIdAndStatusIn(user.getId(), QUALITY_LISTINGS);
        int marketplace = (active >= 1 ? 3 : 0) + (qualityCount >= 5 ? 3 : 0)
                + (qualityCount >= 10 ? 3 : 0)
                + (hasQualityListing(user) ? 3 : 0)
                + (qualityCount >= 3 && blockedListingCount(user.getId()) == 0 ? 3 : 0);
        long completed = orderRepository.countByBuyerIdAndStatusIn(user.getId(), COMPLETED)
                + orderRepository.countBySellerIdAndStatusIn(user.getId(), COMPLETED);
        int orders = (completed >= 1 ? 5 : 0) + (completed >= 3 ? 5 : 0)
                + (completed >= 5 ? 5 : 0) + (completed >= 10 ? 5 : 0);
        long reviewsCount = reviewRepository.countCompletedVisibleByRevieweeId(user.getId());
        double average = reviewRepository.averageCompletedVisibleByRevieweeId(user.getId());
        long positive = reviewRepository.countPositiveCompletedVisibleByRevieweeId(user.getId());
        int reviews = reviewsCount >= 3
                ? average >= 4.8 ? 15 : average >= 4.5 ? 12 : average >= 4.0 ? 8 : average >= 3.5 ? 4 : 0
                : positive >= 2 ? 5 : positive == 1 ? 3 : 0;
        int security = user.getStatus() == AccountStatus.ACTIVE ? 5 : 0;
        int penalties = penaltyFor(user);
        int score = user.getStatus() == AccountStatus.BLOCKED
                ? 0 : Math.max(0, Math.min(100, verification + profile + marketplace + orders + reviews + security - penalties));
        return new Calculation(score, TrustScoreLevel.fromScore(score), verification, profile,
                marketplace, orders, reviews, security, penalties);
    }

    private boolean hasQualityListing(User user) {
        return listingRepository.findAllBySellerIdAndStatus(user.getId(), ListingStatus.ACTIVE).stream()
                .anyMatch(listing -> hasText(listing.getDescription()) && hasText(listing.getPrimaryImageUrl()));
    }

    private int blockedListingCount(Long userId) {
        return (int) listingRepository.findAllBySellerId(userId).stream()
                .flatMap(listing -> actionRepository.findAllByTargetTypeAndTargetIdOrderByCreatedAtAsc(
                        ModerationTargetType.LISTING, listing.getId()).stream())
                .map(ModerationAction::getActionType)
                .filter(type -> type == ModerationActionType.LISTING_BLOCKED)
                .count();
    }

    private int penaltyFor(User user) {
        int penalty = 0;
        for (ModerationAction action : actionRepository.findAllByTargetTypeAndTargetIdOrderByCreatedAtAsc(
                ModerationTargetType.USER, user.getId())) {
            penalty += switch (action.getActionType()) {
                case USER_WARNED -> 5;
                case USER_SUSPENDED -> 30;
                case USER_BLOCKED -> 30;
                case HARASSMENT_CONFIRMED -> 20;
                case FALSE_REPORT_CONFIRMED -> 10;
                case PAYMENT_MANIPULATION_CONFIRMED -> 25;
                default -> 0;
            };
        }
        for (Listing listing : listingRepository.findAllBySellerId(user.getId())) {
            penalty += actionRepository.findAllByTargetTypeAndTargetIdOrderByCreatedAtAsc(
                    ModerationTargetType.LISTING, listing.getId()).stream()
                    .map(ModerationAction::getActionType)
                    .mapToInt(type -> switch (type) {
                        case LISTING_BLOCKED -> 10;
                        case FAKE_LISTING_CONFIRMED -> 15;
                        case SCAM_CONFIRMED -> 25;
                        default -> 0;
                    }).sum();
        }
        for (SellerReview review : reviewRepository.findAllByRevieweeIdAndStatusOrderByCreatedAtDesc(
                user.getId(), ReviewStatus.HIDDEN)) {
            penalty += actionRepository.findAllByTargetTypeAndTargetIdOrderByCreatedAtAsc(
                    ModerationTargetType.REVIEW, review.getId()).stream()
                    .map(ModerationAction::getActionType)
                    .mapToInt(type -> type == ModerationActionType.REVIEW_HIDDEN ? 5 : 0).sum();
        }
        return penalty;
    }

    private TrustScoreHistoryResponse.Entry historyEntry(TrustScoreHistory item) {
        return new TrustScoreHistoryResponse.Entry(item.getId(), item.getScoreBefore(), item.getScoreAfter(),
                item.getChangeValue(), item.getReason(), item.getDescription(), item.getSourceType(), item.getCreatedAt());
    }

    private boolean hasText(String value) { return value != null && !value.isBlank(); }

    private record Calculation(int score, TrustScoreLevel level, int verification, int profile,
                               int marketplace, int orders, int reviews, int security, int penalties) { }
}
