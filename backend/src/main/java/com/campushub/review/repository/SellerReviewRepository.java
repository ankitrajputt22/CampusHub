package com.campushub.review.repository;

import com.campushub.review.model.SellerReview;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SellerReviewRepository extends JpaRepository<SellerReview, Long> {

    long countByRevieweeId(Long revieweeId);

    @Query("select coalesce(avg(review.rating), 0) from SellerReview review where review.reviewee.id = :revieweeId")
    double averageRatingByRevieweeId(@Param("revieweeId") Long revieweeId);

    @EntityGraph(attributePaths = "reviewer")
    List<SellerReview> findTop5ByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);
}
