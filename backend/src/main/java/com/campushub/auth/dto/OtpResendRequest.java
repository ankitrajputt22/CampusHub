package com.campushub.auth.dto;

import jakarta.validation.constraints.NotNull;

public record OtpResendRequest(
        @NotNull(message = "User ID is required.")
        Long userId
) {
}
