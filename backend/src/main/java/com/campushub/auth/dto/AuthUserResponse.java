package com.campushub.auth.dto;

public record AuthUserResponse(
        Long id,
        String fullName,
        String email,
        Long collegeId,
        String collegeName,
        String role,
        String accountStatus,
        int trustScore
) {
}
