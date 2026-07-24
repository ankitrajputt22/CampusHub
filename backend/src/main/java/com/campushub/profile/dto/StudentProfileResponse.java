package com.campushub.profile.dto;

import java.time.Instant;
import java.util.List;

public record StudentProfileResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        CollegeSummary college,
        String department,
        String course,
        String yearOfStudy,
        String rollNumber,
        String hostelArea,
        String profilePhotoUrl,
        String bio,
        String linkedinUrl,
        String githubUrl,
        boolean isEmailVerified,
        boolean isPhoneVerified,
        boolean isVerifiedStudent,
        String role,
        String accountStatus,
        TrustScoreSummary trustScore,
        ProfileCompletionSummary profileCompletion,
        SellerStats sellerStats,
        PrivacySettings privacySettings,
        List<ReviewSummary> latestReviews
) {

    public record CollegeSummary(Long id, String name, String code) {
    }

    public record TrustScoreSummary(
            int score,
            String level,
            List<String> suggestions
    ) {
    }

    public record ProfileCompletionSummary(
            int percentage,
            int completedFields,
            int totalFields,
            List<String> missingFields
    ) {
    }

    public record SellerStats(
            double averageRating,
            long totalReviews,
            long successfulDeals,
            long activeListings,
            long soldItems,
            long ordersCompleted,
            long wishlistItems
    ) {
    }

    public record PrivacySettings(
            boolean showBio,
            boolean showLinkedin,
            boolean showGithub,
            boolean showHostelArea,
            boolean showDepartment,
            boolean showYearOfStudy
    ) {
    }

    public record ReviewSummary(
            Long id,
            String reviewerName,
            int rating,
            String message,
            Instant reviewDate
    ) {
    }
}
