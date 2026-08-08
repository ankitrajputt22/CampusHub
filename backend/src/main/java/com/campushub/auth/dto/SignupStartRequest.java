package com.campushub.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupStartRequest(
        @NotBlank(message = "Full name is required.")
        @Size(min = 3, message = "Full name must be at least 3 characters.")
        @Pattern(regexp = "^[A-Za-z ]+$", message = "Please enter a valid full name.")
        String fullName,

        @NotBlank(message = "Username is required.")
        @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters.")
        @Pattern(
                regexp = "^[a-z0-9_](?!.*\\.\\.)[a-z0-9_.]{1,28}[a-z0-9_]$",
                message = "Use lowercase letters, numbers, underscores, and single dots only."
        )
        String username,

        @NotNull(message = "Please select your college.")
        Long collegeId,

        @NotBlank(message = "Email is required.")
        @Email(message = "Please enter a valid email address.")
        String email,

        @NotBlank(message = "Password is required.")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
                message = "Password must contain uppercase, lowercase, number, and special character."
        )
        String password,

        @NotBlank(message = "Confirm password is required.")
        String confirmPassword,

        @NotBlank(message = "Please select your department / branch.")
        String department,

        String customDepartment,

        @NotBlank(message = "Please select your year of study.")
        String yearOfStudy,

        String customYearOfStudy,

        @Size(max = 80, message = "Please enter a valid roll number / enrollment number.")
        String rollNumber,

        @NotBlank(message = "Please select your course.")
        String course,

        String customCourse,

        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Please enter a valid phone number.")
        String phoneNumber,

        @Size(max = 120, message = "Please enter a valid hostel / campus area.")
        String hostelOrCampusArea,

        String profilePhotoFileName
) {

    @AssertTrue(message = "Password and confirm password do not match.")
    public boolean isPasswordConfirmed() {
        return password != null && password.equals(confirmPassword);
    }
}
