package com.campushub.college.dto;

import com.campushub.college.dto.ExploreCollegesResponse.CollegeCard;
import com.campushub.college.dto.ExploreCollegesResponse.ViewerContext;

public record ExploreCollegeDetailsResponse(
        ViewerContext viewerContext,
        CollegeCard college
) {
}
