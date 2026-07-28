package com.campushub.college.dto;

import java.util.List;

public record ExploreCollegesResponse(
        ViewerContext viewerContext,
        List<CollegeCard> popularColleges,
        List<CollegeCard> colleges
) {

    public record ViewerContext(
            Long verifiedCollegeId,
            String verifiedCollegeName,
            String verifiedCollegeCode
    ) {
    }

    public record CollegeCard(
            Long id,
            String name,
            String code,
            String emailDomain,
            String city,
            String state,
            String logoUrl,
            long activeListings,
            long verifiedStudents,
            long recentlyAddedListings,
            List<String> popularCategories
    ) {
    }
}
