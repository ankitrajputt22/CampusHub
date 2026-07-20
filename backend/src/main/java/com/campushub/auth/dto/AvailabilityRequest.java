package com.campushub.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record AvailabilityRequest(
        @NotBlank(message = "Value is required.")
        String value
) {
}
