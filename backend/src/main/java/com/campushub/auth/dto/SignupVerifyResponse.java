package com.campushub.auth.dto;

public record SignupVerifyResponse(
        Long userId,
        String accountStatus,
        int trustScore
) {
}
