package com.campushub.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewSubmissionRequest(
        @Min(value = 1, message = "Rating must be between 1 and 5.")
        @Max(value = 5, message = "Rating must be between 1 and 5.")
        int rating,

        @NotBlank(message = "Please share a short review.")
        @Size(max = 1000, message = "Review must not exceed 1000 characters.")
        String message
) {
}
