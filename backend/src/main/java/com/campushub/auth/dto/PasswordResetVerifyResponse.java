package com.campushub.auth.dto;

public record PasswordResetVerifyResponse(
        String requestId,
        String resetToken,
        int expiresInSeconds
) {
}
