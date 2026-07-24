package com.campushub.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "Full name is required.")
        @Size(min = 3, max = 120, message = "Full name must be between 3 and 120 characters.")
        @Pattern(
                regexp = "^[\\p{L}]+(?:[ .'-][\\p{L}]+)*$",
                message = "Please enter a valid full name."
        )
        String fullName,

        @Size(max = 250, message = "Bio should not exceed 250 characters.")
        String bio,

        @NotBlank(message = "Hostel / campus area is required.")
        @Size(min = 2, max = 120, message = "Please enter a valid hostel / campus area.")
        String hostelArea,

        @NotBlank(message = "Please select your department / branch.")
        @Size(max = 120, message = "Please enter your department / branch.")
        String department,

        @NotBlank(message = "Please select your course.")
        @Size(max = 80, message = "Please enter your course.")
        String course,

        @NotBlank(message = "Please select your year of study.")
        @Size(max = 80, message = "Please enter your year/status.")
        String yearOfStudy,

        @Size(max = 80, message = "Please enter a valid roll number / enrollment number.")
        @Pattern(
                regexp = "^$|^.{3,80}$",
                message = "Please enter a valid roll number / enrollment number."
        )
        String rollNumber,

        @Size(max = 255, message = "Please enter a valid LinkedIn URL.")
        String linkedinUrl,

        @Size(max = 255, message = "Please enter a valid GitHub URL.")
        String githubUrl
) {
}
