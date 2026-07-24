package com.campushub.order;

import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.order.dto.OrderInitiationResponse;
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final MarketplaceOrderRepository orderRepository;

    public OrderService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            MarketplaceOrderRepository orderRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public OrderInitiationResponse initiateOrder(
            Long authenticatedUserId,
            Long listingId
    ) {
        User buyer = loadActiveStudent(authenticatedUserId);
        Listing listing = listingRepository.findMarketplaceListingForUpdate(listingId)
                .filter(item -> item.getCollege().getId().equals(buyer.getCollege().getId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This listing is unavailable in your college marketplace."
                ));

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new ResourceConflictException("This listing is no longer available to buy.");
        }
        if (listing.getSeller().getStatus() != AccountStatus.ACTIVE) {
            throw new ResourceConflictException("This seller is currently unavailable.");
        }
        if (listing.getSeller().getId().equals(buyer.getId())) {
            throw new ForbiddenException("You cannot buy your own listing.");
        }
        if (orderRepository.existsByListingIdAndStatus(
                listingId,
                OrderStatus.PENDING_PAYMENT
        )) {
            throw new ResourceConflictException(
                    "A payment is already pending for this listing."
            );
        }

        MarketplaceOrder order = orderRepository.save(new MarketplaceOrder(
                listing,
                buyer,
                listing.getSeller(),
                OrderStatus.PENDING_PAYMENT
        ));
        return new OrderInitiationResponse(
                order.getId(),
                listing.getId(),
                listing.getTitle(),
                listing.getPrice(),
                order.getStatus().name(),
                true,
                "Continue to the secure payment step.",
                order.getCreatedAt()
        );
    }

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student account was not found."));
        if (user.getRole() != UserRole.STUDENT || user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("An active student account is required.");
        }
        if (!user.getCollege().isActive()) {
            throw new ForbiddenException("Your college marketplace is currently unavailable.");
        }
        return user;
    }
}
