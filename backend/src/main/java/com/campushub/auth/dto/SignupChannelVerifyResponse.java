package com.campushub.auth.dto;

public record SignupChannelVerifyResponse(
        Long userId,
        boolean emailVerified,
        boolean phoneVerified
) {
}
