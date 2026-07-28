package com.campushub.payment;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.payment.dto.PaymentActionResponse;
import com.campushub.payment.dto.PaymentCheckoutResponse;
import com.campushub.payment.dto.PaymentFailureRequest;
import com.campushub.payment.dto.PaymentVerificationRequest;
import com.campushub.payment.dto.PaymentVerificationResponse;
import com.campushub.payment.dto.PaymentsPageResponse;
import com.campushub.payment.dto.PaymentsPageResponse.PaymentSummary;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/razorpay/verify")
    public ApiResponse<PaymentVerificationResponse> verifyPayment(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody PaymentVerificationRequest request
    ) {
        return ApiResponse.success(
                "Payment verified successfully",
                paymentService.verifyPayment(userId(authenticatedUser), request)
        );
    }

    @PostMapping("/razorpay/retry/{orderId}")
    public ApiResponse<PaymentCheckoutResponse> retryPayment(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long orderId
    ) {
        return ApiResponse.success(
                "Secure payment retry created",
                paymentService.retryPayment(userId(authenticatedUser), orderId)
        );
    }

    @PostMapping("/razorpay/failure")
    public ApiResponse<PaymentActionResponse> recordFailure(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody PaymentFailureRequest request
    ) {
        return ApiResponse.success(
                "Payment failure recorded",
                paymentService.recordFailure(userId(authenticatedUser), request)
        );
    }

    @GetMapping("/my")
    public ApiResponse<PaymentsPageResponse> myPayments(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.success(
                "Payment history loaded",
                paymentService.getMyPayments(
                        userId(authenticatedUser),
                        search,
                        status,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{paymentId}")
    public ApiResponse<PaymentSummary> paymentDetails(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long paymentId
    ) {
        return ApiResponse.success(
                "Payment details loaded",
                paymentService.getPaymentDetails(
                        userId(authenticatedUser),
                        paymentId
                )
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
