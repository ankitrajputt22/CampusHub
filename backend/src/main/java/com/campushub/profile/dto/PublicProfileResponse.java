package com.campushub.profile.dto;

public record PublicProfileResponse(
        Long id,
        String fullName,
        String collegeName,
        String profilePhotoUrl,
        String department,
        String yearOfStudy,
        String bio,
        String linkedinUrl,
        String githubUrl,
        String hostelArea,
        boolean isVerifiedStudent,
        int trustScore,
        String trustLevel,
        double averageRating,
        long totalReviews,
        long successfulDeals,
        long activeListings
) {
}
