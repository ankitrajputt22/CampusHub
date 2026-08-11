package com.campushub.review;

import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.order.model.MarketplaceOrder;
import com.campushub.order.model.OrderStatus;
import com.campushub.order.repository.MarketplaceOrderRepository;
import com.campushub.review.dto.ReviewSubmissionRequest;
import com.campushub.review.dto.ReviewWorkspaceResponse;
import com.campushub.review.dto.ReviewWorkspaceResponse.PendingReview;
import com.campushub.review.dto.ReviewWorkspaceResponse.ReviewItem;
import com.campushub.review.dto.ReviewWorkspaceResponse.ReviewStats;
import com.campushub.review.model.SellerReview;
import com.campushub.review.model.ReviewStatus;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScoreService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final UserRepository userRepository;
    private final MarketplaceOrderRepository orderRepository;
    private final SellerReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final TrustScoreService trustScoreService;

    public ReviewService(
            UserRepository userRepository,
            MarketplaceOrderRepository orderRepository,
            SellerReviewRepository reviewRepository,
            NotificationService notificationService,
            TrustScoreService trustScoreService
    ) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.notificationService = notificationService;
        this.trustScoreService = trustScoreService;
    }

    @Transactional(readOnly = true)
    public ReviewWorkspaceResponse getWorkspace(Long authenticatedUserId) {
        User user = loadActiveStudent(authenticatedUserId);
        List<MarketplaceOrder> pending =
                orderRepository.findPendingReviewOrders(user.getId());
        return new ReviewWorkspaceResponse(
                new ReviewStats(
                        roundedRating(
                                reviewRepository.averageRatingByRevieweeId(
                                        user.getId()
                                )
                        ),
                        reviewRepository.countByRevieweeId(user.getId()),
                        reviewRepository.countByReviewerId(user.getId()),
                        pending.size()
                ),
                pending.stream().map(this::toPending).toList(),
                reviewRepository
                        .findAllByRevieweeIdAndStatusOrderByCreatedAtDesc(
                                user.getId(),
                                ReviewStatus.VISIBLE
                        )
                        .stream()
                        .map(this::toItem)
                        .toList(),
                reviewRepository
                        .findAllByReviewerIdAndStatusOrderByCreatedAtDesc(
                                user.getId(),
                                ReviewStatus.VISIBLE
                        )
                        .stream()
                        .map(this::toItem)
                        .toList()
        );
    }

    @Transactional
    public ReviewItem submit(
            Long authenticatedUserId,
            Long orderId,
            ReviewSubmissionRequest request
    ) {
        User reviewer = loadActiveStudent(authenticatedUserId);
        MarketplaceOrder order = orderRepository.findOrderForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Completed order was not found."
                ));
        if (!order.getBuyer().getId().equals(reviewer.getId())) {
            throw new ResourceNotFoundException(
                    "Completed order was not found."
            );
        }
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new ResourceConflictException(
                    "A review can be submitted only after pickup is completed."
            );
        }
        if (reviewRepository.existsByOrderId(order.getId())) {
            throw new ResourceConflictException(
                    "A review has already been submitted for this order."
            );
        }

        SellerReview review = reviewRepository.save(new SellerReview(
                order,
                reviewer,
                order.getSeller(),
                request.rating(),
                request.message().trim()
        ));
        notificationService.notify(
                order.getSeller(),
                NotificationType.REVIEW,
                NotificationPriority.MEDIUM,
                "New review received",
                reviewer.getFullName() + " gave you a " + request.rating()
                        + "-star review for " + order.getListing().getTitle() + ".",
                RelatedEntityType.REVIEW,
                review.getId(),
                "/student/reviews"
        );
        trustScoreService.recalculateAndSave(
                order.getSeller().getId(), "REVIEW", review.getId(), "Completed-order review received", true
        );
        return toItem(review);
    }

    private PendingReview toPending(MarketplaceOrder order) {
        return new PendingReview(
                order.getId(),
                order.getOrderNumber(),
                order.getListing().getId(),
                order.getListing().getTitle(),
                order.getListing().getPrimaryImageUrl(),
                order.getSeller().getId(),
                order.getSeller().getFullName(),
                order.getCompletedAt()
        );
    }

    private ReviewItem toItem(SellerReview review) {
        return new ReviewItem(
                review.getId(),
                review.getOrder().getId(),
                review.getOrder().getOrderNumber(),
                review.getOrder().getListing().getId(),
                review.getOrder().getListing().getTitle(),
                review.getReviewer().getFullName(),
                review.getReviewee().getFullName(),
                review.getRating(),
                review.getMessage(),
                review.getCreatedAt()
        );
    }

    private User loadActiveStudent(Long userId) {
        User user = userRepository.findDashboardUserById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student account was not found."
                ));
        if (user.getRole() != UserRole.STUDENT
                || user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new ForbiddenException(
                    "An active verified student account is required."
            );
        }
        return user;
    }

    private double roundedRating(double value) {
        return BigDecimal.valueOf(value)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
