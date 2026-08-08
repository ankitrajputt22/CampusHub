package com.campushub.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record SignupChannelVerifyRequest(
        @NotNull(message = "Signup user ID is required.")
        Long userId,

        @NotBlank(message = "OTP is required.")
        @Pattern(regexp = "^[0-9]{6}$", message = "Please enter a valid 6-digit OTP.")
        String otp
) {
}
