package com.campushub.support.dto;

import com.campushub.support.model.SupportCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PublicSupportRequest(
        @NotBlank(message = "Full name is required.")
        @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters.")
        String fullName,
        @NotBlank(message = "Email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 254, message = "Email is too long.")
        String email,
        @NotNull(message = "Please select a category.")
        SupportCategory category,
        @NotBlank(message = "Subject is required.")
        @Size(min = 5, max = 120, message = "Subject must be between 5 and 120 characters.")
        String subject,
        @NotBlank(message = "Description is required.")
        @Size(min = 20, max = 2000, message = "Description must be between 20 and 2000 characters.")
        String description
) {
}
