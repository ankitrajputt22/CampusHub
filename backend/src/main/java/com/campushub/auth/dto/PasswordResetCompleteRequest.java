package com.campushub.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetCompleteRequest(
        @NotBlank(message = "Recovery request is required.")
        String requestId,

        @NotBlank(message = "Reset token is required.")
        String resetToken,

        @NotBlank(message = "New password is required.")
        @Size(
                min = 8,
                max = 72,
                message = "New password must be between 8 and 72 characters."
        )
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                message = "New password must include uppercase, lowercase, number, and special character."
        )
        String newPassword,

        @NotBlank(message = "Please confirm your new password.")
        String confirmPassword
) {
}
