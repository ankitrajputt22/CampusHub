package com.campushub.review.repository;

import com.campushub.review.model.SellerReview;
import com.campushub.review.model.ReviewStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SellerReviewRepository
        extends JpaRepository<SellerReview, Long>,
        JpaSpecificationExecutor<SellerReview> {

    long countByStatus(ReviewStatus status);

    @Query("""
            select count(review)
            from SellerReview review
            where review.reviewee.id = :revieweeId
              and review.status = com.campushub.review.model.ReviewStatus.VISIBLE
            """)
    long countByRevieweeId(@Param("revieweeId") Long revieweeId);

    @Query("""
            select count(review)
            from SellerReview review
            where review.reviewer.id = :reviewerId
              and review.status = com.campushub.review.model.ReviewStatus.VISIBLE
            """)
    long countByReviewerId(@Param("reviewerId") Long reviewerId);

    boolean existsByOrderId(Long orderId);

    @Query("""
            select coalesce(avg(review.rating), 0)
            from SellerReview review
            where review.reviewee.id = :revieweeId
              and review.status = com.campushub.review.model.ReviewStatus.VISIBLE
            """)
    double averageRatingByRevieweeId(@Param("revieweeId") Long revieweeId);

    @EntityGraph(attributePaths = "reviewer")
    List<SellerReview> findTop5ByRevieweeIdAndStatusOrderByCreatedAtDesc(
            Long revieweeId,
            ReviewStatus status
    );

    @EntityGraph(attributePaths = {
            "order",
            "order.listing",
            "reviewer",
            "reviewee"
    })
    List<SellerReview> findAllByRevieweeIdAndStatusOrderByCreatedAtDesc(
            Long revieweeId,
            ReviewStatus status
    );

    @EntityGraph(attributePaths = {
            "order",
            "order.listing",
            "reviewer",
            "reviewee"
    })
    List<SellerReview> findAllByReviewerIdAndStatusOrderByCreatedAtDesc(
            Long reviewerId,
            ReviewStatus status
    );

    @Override
    @EntityGraph(attributePaths = {
            "order",
            "order.listing",
            "order.listing.college",
            "reviewer",
            "reviewee"
    })
    Page<SellerReview> findAll(
            Specification<SellerReview> specification,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "order",
            "order.listing",
            "order.listing.college",
            "reviewer",
            "reviewee"
    })
    @Query("select review from SellerReview review where review.id = :reviewId")
    Optional<SellerReview> findAdminReviewById(@Param("reviewId") Long reviewId);
}
