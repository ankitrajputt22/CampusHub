package com.campushub.payment.dto;

import java.math.BigDecimal;

public record PaymentCheckoutResponse(
        CampusHubOrder order,
        RazorpayCheckout razorpay,
        CheckoutPrefill prefill
) {

    public record CampusHubOrder(
            Long id,
            String orderNumber,
            Long listingId,
            String listingTitle,
            BigDecimal amount,
            String orderStatus,
            String paymentStatus
    ) {
    }

    public record RazorpayCheckout(
            String keyId,
            String razorpayOrderId,
            long amount,
            String currency,
            String name,
            String description
    ) {
    }

    public record CheckoutPrefill(
            String name,
            String email,
            String contact
    ) {
    }
}
