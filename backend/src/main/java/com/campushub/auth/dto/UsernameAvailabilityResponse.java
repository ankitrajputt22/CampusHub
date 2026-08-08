package com.campushub.auth.dto;

public record UsernameAvailabilityResponse(
        boolean available,
        String message
) {
}
