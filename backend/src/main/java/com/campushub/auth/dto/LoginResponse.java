package com.campushub.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        AuthUserResponse user
) {
}
