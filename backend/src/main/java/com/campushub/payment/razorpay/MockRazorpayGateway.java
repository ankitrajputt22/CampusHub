package com.campushub.payment.razorpay;

import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.razorpay.mock-enabled", havingValue = "true")
public class MockRazorpayGateway implements RazorpayGateway {

    @Override
    public RazorpayOrder createOrder(CreateRazorpayOrder request) {
        return new RazorpayOrder(
                "order_test_" + UUID.randomUUID().toString().replace("-", ""),
                request.amount(),
                request.currency(),
                "created"
        );
    }
}
