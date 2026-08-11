package com.campushub.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportInternalNoteRequest(
        @NotBlank(message = "Internal note is required.")
        @Size(min = 2, max = 2000, message = "Internal note must be between 2 and 2000 characters.")
        String message
) {
}
