package com.campushub.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportSubmissionRequest(
        @NotBlank(message = "Please select a report reason.")
        String reason,

        @Size(max = 500, message = "Report details must be 500 characters or fewer.")
        String description
) {
}
