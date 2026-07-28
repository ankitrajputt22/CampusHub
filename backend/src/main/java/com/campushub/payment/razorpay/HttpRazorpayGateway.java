package com.campushub.payment.razorpay;

import com.campushub.payment.razorpay.RazorpayGateway.CreateRazorpayOrder;
import com.campushub.payment.razorpay.RazorpayGateway.RazorpayOrder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "app.razorpay.mock-enabled",
        havingValue = "false",
        matchIfMissing = true
)
public class HttpRazorpayGateway implements RazorpayGateway {

    private final RazorpayProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public HttpRazorpayGateway(
            RazorpayProperties properties,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public RazorpayOrder createOrder(CreateRazorpayOrder request) {
        if (!properties.isConfigured()) {
            throw new RazorpayGatewayException(
                    "Razorpay is not configured. Add test API credentials and try again."
            );
        }
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("amount", request.amount());
            body.put("currency", request.currency());
            body.put("receipt", request.receipt());
            body.put("notes", request.notes());
            body.put("partial_payment", false);
            String credentials = Base64.getEncoder().encodeToString(
                    (properties.keyId() + ":" + properties.keySecret())
                            .getBytes(StandardCharsets.UTF_8)
            );
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(properties.apiBaseUrl() + "/orders"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            objectMapper.writeValueAsString(body)
                    ))
                    .build();
            HttpResponse<String> response = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RazorpayGatewayException(
                        "Razorpay could not create a payment order. Check the configured test keys."
                );
            }
            JsonNode json = objectMapper.readTree(response.body());
            return new RazorpayOrder(
                    requiredText(json, "id"),
                    json.path("amount").asLong(),
                    requiredText(json, "currency"),
                    requiredText(json, "status")
            );
        } catch (RazorpayGatewayException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new RazorpayGatewayException(
                    "Razorpay order creation was interrupted. Please retry.",
                    exception
            );
        } catch (Exception exception) {
            throw new RazorpayGatewayException(
                    "Razorpay is temporarily unavailable. Please retry.",
                    exception
            );
        }
    }

    private String requiredText(JsonNode json, String field) {
        String value = json.path(field).asText();
        if (value.isBlank()) {
            throw new RazorpayGatewayException(
                    "Razorpay returned an incomplete order response."
            );
        }
        return value;
    }
}
