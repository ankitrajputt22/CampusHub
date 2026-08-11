package com.campushub.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        @NotBlank(message = "Message is required.")
        @Size(max = 1000, message = "Message must be 1000 characters or fewer.")
        String message
) {
}
