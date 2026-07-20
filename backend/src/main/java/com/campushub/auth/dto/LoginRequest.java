package com.campushub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "College email is required.")
        @Email(message = "Please enter a valid email address.")
        String email,

        @NotBlank(message = "Password is required.")
        String password,

        boolean rememberMe
) {
}
