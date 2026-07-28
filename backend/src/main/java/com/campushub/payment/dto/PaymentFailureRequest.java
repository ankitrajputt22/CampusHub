package com.campushub.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record PaymentFailureRequest(
        @NotNull @Positive Long campusHubOrderId,
        @NotBlank @Size(max = 100) String razorpayOrderId,
        @Size(max = 100) String errorCode,
        @Size(max = 300) String errorDescription
) {
}
