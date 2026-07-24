package com.campushub.profile.dto;

public record PrivacySettingsRequest(
        boolean showBio,
        boolean showLinkedin,
        boolean showGithub,
        boolean showHostelArea,
        boolean showDepartment,
        boolean showYearOfStudy
) {
}
