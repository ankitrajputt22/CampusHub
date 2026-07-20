package com.campushub.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record SignupVerifyRequest(
        @NotNull(message = "User ID is required.")
        Long userId,

        @NotBlank(message = "Email OTP is required.")
        @Pattern(regexp = "^\\d{6}$", message = "Please enter a valid 6-digit OTP.")
        String emailOtp,

        @NotBlank(message = "Phone OTP is required.")
        @Pattern(regexp = "^\\d{6}$", message = "Please enter a valid 6-digit OTP.")
        String phoneOtp
) {
}
