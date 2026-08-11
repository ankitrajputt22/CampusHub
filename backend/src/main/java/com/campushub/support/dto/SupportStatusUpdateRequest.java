package com.campushub.support.dto;

import com.campushub.support.model.SupportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SupportStatusUpdateRequest(
        @NotNull(message = "Ticket status is required.")
        SupportStatus status,
        @Size(max = 500, message = "Status note must be at most 500 characters.")
        String note
) {
}
