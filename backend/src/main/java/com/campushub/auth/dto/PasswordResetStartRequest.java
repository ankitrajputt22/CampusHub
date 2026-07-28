package com.campushub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PasswordResetStartRequest(
        @NotBlank(message = "College email is required.")
        @Email(message = "Please enter a valid email address.")
        String email
) {
}
