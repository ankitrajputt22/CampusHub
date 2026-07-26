package com.campushub.marketplace.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateListingRequest(
        @NotBlank(message = "Product title is required.")
        @Size(
                min = 5,
                max = 100,
                message = "Product title must be between 5 and 100 characters."
        )
        String title,

        @NotBlank(message = "Category is required.")
        String category,

        @NotBlank(message = "Description is required.")
        @Size(
                min = 20,
                max = 1000,
                message = "Description must be between 20 and 1000 characters."
        )
        String description,

        @NotNull(message = "Price is required.")
        @DecimalMin(value = "1.00", message = "Price must be at least ₹1.")
        @DecimalMax(value = "100000.00", message = "Price cannot exceed ₹1,00,000.")
        BigDecimal price,

        @NotBlank(message = "Condition is required.")
        String condition,

        @NotBlank(message = "Pickup location is required.")
        @Size(
                min = 2,
                max = 100,
                message = "Pickup location must be between 2 and 100 characters."
        )
        String pickupLocation,

        @NotNull(message = "Please choose whether the price is negotiable.")
        Boolean negotiable,

        @NotNull(message = "Available quantity is required.")
        @Min(value = 1, message = "Available quantity must be at least 1.")
        @Max(value = 50, message = "Available quantity cannot exceed 50.")
        Integer availableQuantity,

        @Size(max = 500, message = "Additional notes cannot exceed 500 characters.")
        String additionalNotes
) {
}
