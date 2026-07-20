package com.campushub.auth.dto;

public record OtpSendResponse(
        Long userId,
        String channel,
        int expiresInSeconds,
        int resendAfterSeconds,
        String devOtp
) {
}
