package com.campushub.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record PaymentVerificationRequest(
        @NotNull @Positive Long campusHubOrderId,
        @NotBlank @Size(max = 100) String razorpayOrderId,
        @NotBlank @Size(max = 100) String razorpayPaymentId,
        @NotBlank @Size(max = 255) String razorpaySignature
) {
}
