package com.campushub.support.dto;

import com.campushub.support.model.SupportCategory;
import com.campushub.support.model.SupportRelatedEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SupportTicketRequest(
        @NotNull(message = "Please select a category.")
        SupportCategory category,
        @NotBlank(message = "Subject is required.")
        @Size(min = 5, max = 120, message = "Subject must be between 5 and 120 characters.")
        String subject,
        @NotBlank(message = "Description is required.")
        @Size(min = 20, max = 2000, message = "Description must be between 20 and 2000 characters.")
        String description,
        SupportRelatedEntityType relatedEntityType,
        Long relatedEntityId
) {
}
