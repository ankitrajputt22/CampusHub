package com.campushub.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageReportRequest(
        @NotBlank(message = "Report reason is required.")
        String reason,
        @Size(max = 500, message = "Report details must be 500 characters or fewer.")
        String description
) {
}
