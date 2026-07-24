package com.campushub.profile.dto;

public record ProfilePhotoResponse(
        String profilePhotoUrl,
        int trustScore,
        int profileCompletionPercentage
) {
}
