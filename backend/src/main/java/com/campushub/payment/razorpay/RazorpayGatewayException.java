package com.campushub.payment.razorpay;

public class RazorpayGatewayException extends RuntimeException {

    public RazorpayGatewayException(String message) {
        super(message);
    }

    public RazorpayGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}
