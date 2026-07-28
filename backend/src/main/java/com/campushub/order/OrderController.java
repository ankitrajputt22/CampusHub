package com.campushub.order;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.order.dto.OrderActionResponse;
import com.campushub.order.dto.OrderDetailsResponse;
import com.campushub.order.dto.OrderInitiationResponse;
import com.campushub.order.dto.OrdersPageResponse;
import com.campushub.payment.PaymentService;
import com.campushub.payment.dto.PaymentCheckoutResponse;
import com.campushub.security.AuthenticatedUser;
import java.math.BigDecimal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    public OrderController(OrderService orderService, PaymentService paymentService) {
        this.orderService = orderService;
        this.paymentService = paymentService;
    }

    @PostMapping("/listings/{listingId}")
    public ApiResponse<OrderInitiationResponse> initiateOrder(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Order created and ready for secure payment",
                orderService.initiateOrder(userId(authenticatedUser), listingId)
        );
    }

    @PostMapping("/create-from-listing/{listingId}")
    public ApiResponse<PaymentCheckoutResponse> createFromListing(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long listingId
    ) {
        return ApiResponse.success(
                "Campus Hub and Razorpay orders created",
                paymentService.createCheckoutFromListing(
                        userId(authenticatedUser),
                        listingId
                )
        );
    }

    @GetMapping("/buyer")
    public ApiResponse<OrdersPageResponse> buyerOrders(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String dateRange,
            @RequestParam(defaultValue = "recent") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.success(
                "Purchase orders loaded",
                orderService.getBuyerOrders(
                        userId(authenticatedUser),
                        search,
                        status,
                        paymentStatus,
                        category,
                        minPrice,
                        maxPrice,
                        dateRange,
                        sortBy,
                        page,
                        size
                )
        );
    }

    @GetMapping("/seller")
    public ApiResponse<OrdersPageResponse> sellerOrders(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String dateRange,
            @RequestParam(defaultValue = "recent") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.success(
                "Sales orders loaded",
                orderService.getSellerOrders(
                        userId(authenticatedUser),
                        search,
                        status,
                        paymentStatus,
                        category,
                        minPrice,
                        maxPrice,
                        dateRange,
                        sortBy,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{orderId}")
    public ApiResponse<OrderDetailsResponse> orderDetails(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long orderId
    ) {
        return ApiResponse.success(
                "Order details loaded",
                orderService.getOrderDetails(userId(authenticatedUser), orderId)
        );
    }

    @PatchMapping("/{orderId}/cancel")
    public ApiResponse<OrderActionResponse> cancelOrder(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long orderId
    ) {
        OrderActionResponse response = orderService.cancelOrder(
                userId(authenticatedUser),
                orderId
        );
        return ApiResponse.success(response.message(), response);
    }

    @PatchMapping("/{orderId}/ready-for-pickup")
    public ApiResponse<OrderActionResponse> readyForPickup(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long orderId
    ) {
        OrderActionResponse response = orderService.markReadyForPickup(
                userId(authenticatedUser),
                orderId
        );
        return ApiResponse.success(response.message(), response);
    }

    @PatchMapping("/{orderId}/confirm-pickup")
    public ApiResponse<OrderActionResponse> confirmPickup(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long orderId
    ) {
        OrderActionResponse response = orderService.confirmPickup(
                userId(authenticatedUser),
                orderId
        );
        return ApiResponse.success(response.message(), response);
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
