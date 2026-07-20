package com.campushub.college.dto;

import com.campushub.college.model.College;

public record CollegeSummaryResponse(
        Long id,
        String name,
        String code,
        String emailDomain
) {

    public static CollegeSummaryResponse from(College college) {
        return new CollegeSummaryResponse(
                college.getId(),
                college.getName(),
                college.getCode(),
                college.getEmailDomain()
        );
    }
}
