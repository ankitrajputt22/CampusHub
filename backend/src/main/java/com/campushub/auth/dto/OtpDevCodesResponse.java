package com.campushub.auth.dto;

public record OtpDevCodesResponse(
        String emailOtp,
        String phoneOtp
) {
}
