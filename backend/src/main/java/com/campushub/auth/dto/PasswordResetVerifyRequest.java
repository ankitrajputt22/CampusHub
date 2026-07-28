package com.campushub.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordResetVerifyRequest(
        @NotBlank(message = "Recovery request is required.")
        String requestId,

        @NotBlank(message = "Recovery code is required.")
        @Pattern(regexp = "^\\d{6}$", message = "Recovery code must contain 6 digits.")
        String otp
) {
}
