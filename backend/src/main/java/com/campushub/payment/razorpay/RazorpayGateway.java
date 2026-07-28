package com.campushub.payment.razorpay;

import java.util.Map;

public interface RazorpayGateway {

    RazorpayOrder createOrder(CreateRazorpayOrder request);

    record CreateRazorpayOrder(
            long amount,
            String currency,
            String receipt,
            Map<String, String> notes
    ) {
    }

    record RazorpayOrder(
            String id,
            long amount,
            String currency,
            String status
    ) {
    }
}
