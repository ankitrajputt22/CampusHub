package com.campushub.moderation.dto;

import jakarta.validation.constraints.Size;

public record ReportStatusRequest(
        @Size(max = 500, message = "Moderator notes must be 500 characters or fewer.")
        String note
) {
}
