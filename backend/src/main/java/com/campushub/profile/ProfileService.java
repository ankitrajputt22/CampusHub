package com.campushub.profile;

import com.campushub.auth.service.RefreshTokenService;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.profile.dto.ChangePasswordRequest;
import com.campushub.profile.dto.PrivacySettingsRequest;
import com.campushub.profile.dto.ProfilePhotoResponse;
import com.campushub.profile.dto.ProfileSummaryResponse;
import com.campushub.profile.dto.ProfileUpdateRequest;
import com.campushub.profile.dto.PublicProfileResponse;
import com.campushub.profile.dto.StudentProfileResponse;
import com.campushub.profile.dto.StudentProfileResponse.CollegeSummary;
import com.campushub.profile.dto.StudentProfileResponse.PrivacySettings;
import com.campushub.profile.dto.StudentProfileResponse.ProfileCompletionSummary;
import com.campushub.profile.dto.StudentProfileResponse.ReviewSummary;
import com.campushub.profile.dto.StudentProfileResponse.SellerStats;
import com.campushub.profile.dto.StudentProfileResponse.TrustScoreSummary;
import com.campushub.profile.model.ProfilePrivacySettings;
import com.campushub.profile.photo.ProfilePhotoStorage;
import com.campushub.profile.photo.StoredProfilePhoto;
import com.campushub.profile.repository.ProfilePrivacySettingsRepository;
import com.campushub.review.model.SellerReview;
import com.campushub.review.model.ReviewStatus;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import com.campushub.wishlist.repository.WishlistItemRepository;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfileService {

    private static final int PROFILE_FIELD_COUNT = 11;

    private final UserRepository userRepository;
    private final ProfilePrivacySettingsRepository privacyRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final SellerReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final ProfilePhotoStorage photoStorage;
    private final NotificationService notificationService;

    public ProfileService(
            UserRepository userRepository,
            ProfilePrivacySettingsRepository privacyRepository,
            TrustScoreRepository trustScoreRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository,
            WishlistItemRepository wishlistItemRepository,
            SellerReviewRepository reviewRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService,
            ProfilePhotoStorage photoStorage,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.privacyRepository = privacyRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.photoStorage = photoStorage;
        this.notificationService = notificationService;
    }

    @Transactional
    public StudentProfileResponse getProfile(Long authenticatedUserId) {
        User user = loadActiveStudent(authenticatedUserId);
        ProfilePrivacySettings privacy = loadPrivacy(user);
        TrustScore trustScore = recalculateTrustScore(user);
        return buildProfile(user, privacy, trustScore);
    }

    @Transactional
    public StudentProfileResponse updateProfile(
            Long authenticatedUserId,
            ProfileUpdateRequest request
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        int previousTrustScore = currentTrustScore(user);
        user.updateEditableProfile(
                normalizeRequiredText(request.fullName()),
                normalizeBio(request.bio()),
                normalizeRequiredText(request.hostelArea()),
                normalizeRequiredText(request.department()),
                normalizeRequiredText(request.course()),
                normalizeRequiredText(request.yearOfStudy()),
                normalizeOptionalText(request.rollNumber()),
                normalizeSocialUrl(request.linkedinUrl(), "linkedin.com", "LinkedIn"),
                normalizeSocialUrl(request.githubUrl(), "github.com", "GitHub")
        );
        TrustScore trustScore = recalculateTrustScore(user);
        notifyTrustScoreChange(user, previousTrustScore, trustScore.getScore());
        return buildProfile(user, loadPrivacy(user), trustScore);
    }

    @Transactional
    public StudentProfileResponse updatePrivacy(
            Long authenticatedUserId,
            PrivacySettingsRequest request
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        ProfilePrivacySettings privacy = loadPrivacy(user);
        privacy.update(
                request.showBio(),
                request.showLinkedin(),
                request.showGithub(),
                request.showHostelArea(),
                request.showDepartment(),
                request.showYearOfStudy()
        );
        return buildProfile(user, privacy, recalculateTrustScore(user));
    }

    @Transactional
    public ProfilePhotoResponse updateProfilePhoto(
            Long authenticatedUserId,
            MultipartFile photo
    ) {
        User user = loadActiveStudent(authenticatedUserId);
        int previousTrustScore = currentTrustScore(user);
        StoredProfilePhoto storedPhoto = photoStorage.store(user.getId(), photo);
        user.updateProfilePhoto(storedPhoto.publicUrl(), storedPhoto.fileName());
        TrustScore trustScore = recalculateTrustScore(user);
        notifyTrustScoreChange(user, previousTrustScore, trustScore.getScore());
        ProfileCompletionSummary completion = calculateProfileCompletion(user);
        return new ProfilePhotoResponse(
                storedPhoto.publicUrl(),
                trustScore.getScore(),
                completion.percentage()
        );
    }

    @Transactional(readOnly = true)
    public Resource loadProfilePhoto(String fileName) {
        return photoStorage.load(fileName);
    }

    public String profilePhotoContentType(String fileName) {
        return photoStorage.contentType(fileName);
    }

    @Transactional
    public void changePassword(Long authenticatedUserId, ChangePasswordRequest request) {
        User user = loadActiveStudent(authenticatedUserId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from your current password.");
        }
        user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
        notificationService.notify(
                user,
                NotificationType.SECURITY,
                NotificationPriority.HIGH,
                "Password changed",
                "Your Campus Hub password was changed successfully.",
                RelatedEntityType.PROFILE,
                user.getId(),
                "/student/profile"
        );
        refreshTokenService.revokeAllForUser(user.getId());
    }

    @Transactional
    public String requestDeactivation(Long authenticatedUserId) {
        User user = loadActiveStudent(authenticatedUserId);
        user.requestDeactivation();
        refreshTokenService.revokeAllForUser(user.getId());
        return user.getStatus().name();
    }

    @Transactional
    public PublicProfileResponse getPublicProfile(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile was not found."));
        validatePublicProfile(user);
        ProfilePrivacySettings privacy = loadPrivacy(user);
        TrustScore trustScore = recalculateTrustScore(user);
        SellerStats stats = sellerStats(user.getId());

        return new PublicProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getCollege().getName(),
                user.getProfilePhotoUrl(),
                privacy.isShowDepartment() ? effectiveDepartment(user) : null,
                privacy.isShowYearOfStudy() ? effectiveYearOfStudy(user) : null,
                privacy.isShowBio() ? user.getBio() : null,
                privacy.isShowLinkedin() ? user.getLinkedinUrl() : null,
                privacy.isShowGithub() ? user.getGithubUrl() : null,
                privacy.isShowHostelArea() ? user.getHostelOrCampusArea() : null,
                isVerifiedStudent(user),
                trustScore.getScore(),
                trustLevel(trustScore.getScore()),
                stats.averageRating(),
                stats.totalReviews(),
                stats.successfulDeals(),
                stats.activeListings()
        );
    }

    @Transactional
    public ProfileSummaryResponse getProfileSummary(Long authenticatedUserId) {
        User user = loadActiveStudent(authenticatedUserId);
        TrustScore trustScore = recalculateTrustScore(user);
        return new ProfileSummaryResponse(
                trustScoreSummary(user, trustScore),
                calculateProfileCompletion(user),
                sellerStats(user.getId())
        );
    }

    private StudentProfileResponse buildProfile(
            User user,
            ProfilePrivacySettings privacy,
            TrustScore trustScore
    ) {
        return new StudentProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                new CollegeSummary(
                        user.getCollege().getId(),
                        user.getCollege().getName(),
                        user.getCollege().getCode()
                ),
                effectiveDepartment(user),
                effectiveCourse(user),
                effectiveYearOfStudy(user),
                user.getRollNumber(),
                user.getHostelOrCampusArea(),
                user.getProfilePhotoUrl(),
                user.getBio(),
                user.getLinkedinUrl(),
                user.getGithubUrl(),
                user.isEmailVerified(),
                user.isPhoneVerified(),
                isVerifiedStudent(user),
                user.getRole().name(),
                user.getStatus().name(),
                trustScoreSummary(user, trustScore),
                calculateProfileCompletion(user),
                sellerStats(user.getId()),
                mapPrivacy(privacy),
                reviewRepository.findTop5ByRevieweeIdAndStatusOrderByCreatedAtDesc(
                                user.getId(),
                                ReviewStatus.VISIBLE
                        ).stream()
                        .map(this::mapReview)
                        .toList()
        );
    }

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated account is no longer available."));
        if (user.getRole() != UserRole.STUDENT) {
            throw new ForbiddenException("Student profile access is available only to student accounts.");
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new UnauthorizedException("Your account is not active.");
        }
        if (!user.isEmailVerified() || !user.isPhoneVerified()) {
            throw new UnauthorizedException("Email and phone verification are required.");
        }
        return user;
    }

    private void validatePublicProfile(User user) {
        if (user.getRole() != UserRole.STUDENT
                || user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new ResourceNotFoundException("Student profile was not found.");
        }
    }

    private ProfilePrivacySettings loadPrivacy(User user) {
        return privacyRepository.findByUserId(user.getId())
                .orElseGet(() -> privacyRepository.save(new ProfilePrivacySettings(user)));
    }

    private TrustScore recalculateTrustScore(User user) {
        int verifiedBaseScore = (user.isEmailVerified() ? 20 : 0) + (user.isPhoneVerified() ? 10 : 0);
        TrustScore trustScore = trustScoreRepository.findByUserId(user.getId())
                .orElseGet(() -> trustScoreRepository.save(
                        new TrustScore(user, verifiedBaseScore, "Verified account trust score")
                ));
        trustScore.recalculateProfilePoints(
                hasText(user.getProfilePhotoUrl()),
                hasText(user.getBio()),
                hasText(user.getLinkedinUrl()) || hasText(user.getGithubUrl())
        );
        return trustScore;
    }

    private int currentTrustScore(User user) {
        return trustScoreRepository.findByUserId(user.getId())
                .map(TrustScore::getScore)
                .orElse((user.isEmailVerified() ? 20 : 0)
                        + (user.isPhoneVerified() ? 10 : 0));
    }

    private void notifyTrustScoreChange(User user, int previousScore, int newScore) {
        if (previousScore == newScore) {
            return;
        }
        notificationService.notify(
                user,
                NotificationType.SYSTEM,
                NotificationPriority.LOW,
                "Trust score updated",
                "Your Campus Trust Score changed from " + previousScore
                        + " to " + newScore + ".",
                RelatedEntityType.TRUST_SCORE,
                user.getId(),
                "/student/profile"
        );
    }

    private ProfileCompletionSummary calculateProfileCompletion(User user) {
        List<String> missing = new ArrayList<>();
        addIfMissing(missing, "Full name", user.getFullName());
        if (!user.isEmailVerified()) {
            missing.add("College email verification");
        }
        if (!user.isPhoneVerified()) {
            missing.add("Phone verification");
        }
        addIfMissing(missing, "Department / branch", effectiveDepartment(user));
        addIfMissing(missing, "Course", effectiveCourse(user));
        addIfMissing(missing, "Year of study", effectiveYearOfStudy(user));
        addIfMissing(missing, "Hostel / campus area", user.getHostelOrCampusArea());
        addIfMissing(missing, "Profile photo", user.getProfilePhotoUrl());
        addIfMissing(missing, "Bio", user.getBio());
        addIfMissing(missing, "LinkedIn URL", user.getLinkedinUrl());
        addIfMissing(missing, "GitHub URL", user.getGithubUrl());

        int completed = PROFILE_FIELD_COUNT - missing.size();
        return new ProfileCompletionSummary(
                Math.round(completed * 100f / PROFILE_FIELD_COUNT),
                completed,
                PROFILE_FIELD_COUNT,
                List.copyOf(missing)
        );
    }

    private TrustScoreSummary trustScoreSummary(User user, TrustScore trustScore) {
        List<String> suggestions = new ArrayList<>();
        if (!hasText(user.getProfilePhotoUrl())) {
            suggestions.add("Add a clear profile photo.");
        }
        if (!hasText(user.getBio())) {
            suggestions.add("Add a short bio.");
        }
        if (!hasText(user.getLinkedinUrl()) && !hasText(user.getGithubUrl())) {
            suggestions.add("Connect LinkedIn or GitHub.");
        }
        if (orderRepository.countBySellerIdAndStatus(user.getId(), OrderStatus.COMPLETED) == 0) {
            suggestions.add("Complete your first successful sale.");
        }
        if (reviewRepository.countByRevieweeId(user.getId()) == 0) {
            suggestions.add("Earn a positive order-based review.");
        }
        return new TrustScoreSummary(
                trustScore.getScore(),
                trustLevel(trustScore.getScore()),
                suggestions.stream().limit(5).toList()
        );
    }

    private SellerStats sellerStats(Long userId) {
        long completedSales = orderRepository.countBySellerIdAndStatus(userId, OrderStatus.COMPLETED);
        return new SellerStats(
                roundRating(reviewRepository.averageRatingByRevieweeId(userId)),
                reviewRepository.countByRevieweeId(userId),
                completedSales,
                listingRepository.countBySellerIdAndStatus(userId, ListingStatus.ACTIVE),
                completedSales,
                orderRepository.countByBuyerIdAndStatus(userId, OrderStatus.COMPLETED),
                wishlistItemRepository.countByUserId(userId)
        );
    }

    private PrivacySettings mapPrivacy(ProfilePrivacySettings privacy) {
        return new PrivacySettings(
                privacy.isShowBio(),
                privacy.isShowLinkedin(),
                privacy.isShowGithub(),
                privacy.isShowHostelArea(),
                privacy.isShowDepartment(),
                privacy.isShowYearOfStudy()
        );
    }

    private ReviewSummary mapReview(SellerReview review) {
        return new ReviewSummary(
                review.getId(),
                review.getReviewer().getFullName(),
                review.getRating(),
                review.getMessage(),
                review.getCreatedAt()
        );
    }

    private String normalizeSocialUrl(String value, String requiredHost, String label) {
        String normalized = normalizeOptionalText(value);
        if (normalized == null) {
            return null;
        }
        try {
            URI uri = new URI(normalized);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            boolean allowedScheme = "https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme);
            boolean allowedHost = host != null && (
                    host.equalsIgnoreCase(requiredHost)
                            || host.toLowerCase(Locale.ROOT).endsWith("." + requiredHost)
            );
            if (!allowedScheme || !allowedHost) {
                throw new BadRequestException("Please enter a valid " + label + " URL.");
            }
            return uri.normalize().toString();
        } catch (URISyntaxException exception) {
            throw new BadRequestException("Please enter a valid " + label + " URL.");
        }
    }

    private String normalizeBio(String value) {
        String normalized = normalizeOptionalText(value);
        if (normalized == null) {
            return null;
        }
        return normalized.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");
    }

    private String normalizeRequiredText(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String effectiveDepartment(User user) {
        return effectiveValue(user.getDepartment(), user.getCustomDepartment());
    }

    private String effectiveCourse(User user) {
        return effectiveValue(user.getCourse(), user.getCustomCourse());
    }

    private String effectiveYearOfStudy(User user) {
        return effectiveValue(user.getYearOfStudy(), user.getCustomYearOfStudy());
    }

    private String effectiveValue(String selectedValue, String customValue) {
        if ("Other".equalsIgnoreCase(selectedValue) && hasText(customValue)) {
            return customValue.trim();
        }
        return selectedValue;
    }

    private void addIfMissing(List<String> missing, String label, String value) {
        if (!hasText(value)) {
            missing.add(label);
        }
    }

    private boolean isVerifiedStudent(User user) {
        return user.getStatus() == AccountStatus.ACTIVE
                && user.isEmailVerified()
                && user.isPhoneVerified();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
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

    private double roundRating(double rating) {
        return Math.round(rating * 10.0) / 10.0;
    }
}
