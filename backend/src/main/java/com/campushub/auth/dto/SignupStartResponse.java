package com.campushub.auth.dto;

public record SignupStartResponse(
        Long userId,
        String accountStatus,
        int otpExpiresInSeconds,
        int resendAfterSeconds,
        OtpDevCodesResponse devOtpCodes
) {
}
