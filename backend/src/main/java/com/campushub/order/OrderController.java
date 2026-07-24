package com.campushub.order;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.order.dto.OrderInitiationResponse;
import com.campushub.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
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

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
