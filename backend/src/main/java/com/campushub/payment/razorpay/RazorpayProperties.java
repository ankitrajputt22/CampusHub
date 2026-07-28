package com.campushub.payment.razorpay;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RazorpayProperties {

    private final String keyId;
    private final String keySecret;
    private final String apiBaseUrl;

    public RazorpayProperties(
            @Value("${app.razorpay.key-id:}") String keyId,
            @Value("${app.razorpay.key-secret:}") String keySecret,
            @Value("${app.razorpay.api-base-url:https://api.razorpay.com/v1}")
            String apiBaseUrl
    ) {
        this.keyId = keyId.trim();
        this.keySecret = keySecret.trim();
        this.apiBaseUrl = apiBaseUrl.replaceAll("/+$", "");
    }

    public String keyId() {
        return keyId;
    }

    public String keySecret() {
        return keySecret;
    }

    public String apiBaseUrl() {
        return apiBaseUrl;
    }

    public boolean isConfigured() {
        return !keyId.isBlank() && !keySecret.isBlank();
    }
}
