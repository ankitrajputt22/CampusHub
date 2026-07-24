package com.campushub.profile.dto;

import com.campushub.profile.dto.StudentProfileResponse.ProfileCompletionSummary;
import com.campushub.profile.dto.StudentProfileResponse.SellerStats;
import com.campushub.profile.dto.StudentProfileResponse.TrustScoreSummary;

public record ProfileSummaryResponse(
        TrustScoreSummary trustScore,
        ProfileCompletionSummary profileCompletion,
        SellerStats sellerStats
) {
}
