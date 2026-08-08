package com.campushub.auth.dto;

import jakarta.validation.constraints.NotNull;

public record SignupCompleteRequest(
        @NotNull(message = "Signup user ID is required.")
        Long userId
) {
}
