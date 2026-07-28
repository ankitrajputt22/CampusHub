package com.campushub.auth.dto;

public record PasswordResetStartResponse(
        String requestId,
        int expiresInSeconds,
        int resendAfterSeconds,
        String devOtp
) {
}
