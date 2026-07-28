package com.campushub.moderation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ModerationRequest(
        @NotNull(message = "A report ID is required.")
        Long reportId,

        @Size(max = 500, message = "Moderator notes must be 500 characters or fewer.")
        String note
) {
}
