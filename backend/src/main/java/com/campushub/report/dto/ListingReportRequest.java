package com.campushub.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ListingReportRequest(
        @NotBlank(message = "Please select a report reason.")
        String reason,

        @Size(max = 1000, message = "Report description must be 1000 characters or fewer.")
        String description
) {
}
