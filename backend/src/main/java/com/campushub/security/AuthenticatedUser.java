package com.campushub.security;

import com.campushub.user.model.UserRole;

public record AuthenticatedUser(
        Long userId,
        UserRole role
) {
}
