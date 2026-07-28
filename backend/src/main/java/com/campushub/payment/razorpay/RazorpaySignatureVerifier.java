package com.campushub.payment.razorpay;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class RazorpaySignatureVerifier {

    private final RazorpayProperties properties;

    public RazorpaySignatureVerifier(RazorpayProperties properties) {
        this.properties = properties;
    }

    public boolean isValid(
            String storedRazorpayOrderId,
            String razorpayPaymentId,
            String suppliedSignature
    ) {
        if (!properties.isConfigured()) {
            throw new RazorpayGatewayException(
                    "Razorpay is not configured. Payment cannot be verified."
            );
        }
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(
                    properties.keySecret().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));
            byte[] expected = HexFormat.of().formatHex(
                    hmac.doFinal(
                            (storedRazorpayOrderId + "|" + razorpayPaymentId)
                                    .getBytes(StandardCharsets.UTF_8)
                    )
            ).getBytes(StandardCharsets.US_ASCII);
            byte[] supplied = suppliedSignature
                    .toLowerCase()
                    .getBytes(StandardCharsets.US_ASCII);
            return MessageDigest.isEqual(expected, supplied);
        } catch (Exception exception) {
            throw new RazorpayGatewayException(
                    "Payment signature verification could not be completed.",
                    exception
            );
        }
    }
}
