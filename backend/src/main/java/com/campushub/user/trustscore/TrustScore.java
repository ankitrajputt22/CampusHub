package com.campushub.user.trustscore;

import com.campushub.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "trust_scores")
public class TrustScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false, length = 120)
    private String reason;

    @Column(name = "profile_photo_points", nullable = false)
    private int profilePhotoPoints;

    @Column(name = "bio_points", nullable = false)
    private int bioPoints;

    @Column(name = "social_profile_points", nullable = false)
    private int socialProfilePoints;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TrustScoreLevel level = TrustScoreLevel.NEW_LOW_TRUST;

    @Column(name = "verification_score", nullable = false)
    private int verificationScore;

    @Column(name = "profile_completion_score", nullable = false)
    private int profileCompletionScore;

    @Column(name = "marketplace_activity_score", nullable = false)
    private int marketplaceActivityScore;

    @Column(name = "order_completion_score", nullable = false)
    private int orderCompletionScore;

    @Column(name = "reviews_rating_score", nullable = false)
    private int reviewsRatingScore;

    @Column(name = "account_security_score", nullable = false)
    private int accountSecurityScore;

    @Column(name = "penalty_score", nullable = false)
    private int penaltyScore;

    @Column(name = "last_calculated_at", nullable = false)
    private Instant lastCalculatedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TrustScore() {
    }

    public TrustScore(User user, int score, String reason) {
        this.user = user;
        this.score = score;
        this.reason = reason;
        this.createdAt = Instant.now();
        this.lastCalculatedAt = this.createdAt;
        this.updatedAt = this.createdAt;
        this.level = TrustScoreLevel.fromScore(score);
    }

    public int getScore() {
        return score;
    }

    public User getUser() {
        return user;
    }

    public TrustScoreLevel getLevel() { return level; }
    public int getVerificationScore() { return verificationScore; }
    public int getProfileCompletionScore() { return profileCompletionScore; }
    public int getMarketplaceActivityScore() { return marketplaceActivityScore; }
    public int getOrderCompletionScore() { return orderCompletionScore; }
    public int getReviewsRatingScore() { return reviewsRatingScore; }
    public int getAccountSecurityScore() { return accountSecurityScore; }
    public int getPenaltyScore() { return penaltyScore; }
    public Instant getLastCalculatedAt() { return lastCalculatedAt; }

    public void updateCalculation(
            int score,
            TrustScoreLevel level,
            int verificationScore,
            int profileCompletionScore,
            int marketplaceActivityScore,
            int orderCompletionScore,
            int reviewsRatingScore,
            int accountSecurityScore,
            int penaltyScore,
            String reason
    ) {
        this.score = Math.max(0, Math.min(100, score));
        this.level = level;
        this.verificationScore = verificationScore;
        this.profileCompletionScore = profileCompletionScore;
        this.marketplaceActivityScore = marketplaceActivityScore;
        this.orderCompletionScore = orderCompletionScore;
        this.reviewsRatingScore = reviewsRatingScore;
        this.accountSecurityScore = accountSecurityScore;
        this.penaltyScore = penaltyScore;
        this.reason = reason;
        this.lastCalculatedAt = Instant.now();
        this.updatedAt = this.lastCalculatedAt;
        this.profilePhotoPoints = profileCompletionScore;
        this.bioPoints = 0;
        this.socialProfilePoints = 0;
    }

    public void recalculateProfilePoints(
            boolean hasProfilePhoto,
            boolean hasBio,
            boolean hasSocialProfile
    ) {
        int priorProfilePoints = profilePhotoPoints + bioPoints + socialProfilePoints;
        int baseScore = Math.max(0, score - priorProfilePoints);
        profilePhotoPoints = hasProfilePhoto ? 5 : 0;
        bioPoints = hasBio ? 5 : 0;
        socialProfilePoints = hasSocialProfile ? 5 : 0;
        score = Math.min(100, baseScore + profilePhotoPoints + bioPoints + socialProfilePoints);
        reason = "Rule-based Campus Trust Score";
    }
}
