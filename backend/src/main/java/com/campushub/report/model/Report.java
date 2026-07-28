package com.campushub.report.model;

import com.campushub.listing.model.Listing;
import com.campushub.review.model.SellerReview;
import com.campushub.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 30)
    private ReportType type;

    @Column(name = "reported_entity_id", nullable = false)
    private Long reportedEntityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private SellerReview review;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private ReportReason reason;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportPriority priority;

    @Column(name = "admin_response", length = 500)
    private String adminResponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Report() {
    }

    private Report(
            User reporter,
            ReportType type,
            Long reportedEntityId,
            Listing listing,
            User reportedUser,
            SellerReview review,
            ReportReason reason,
            String description,
            ReportPriority priority
    ) {
        this.reporter = reporter;
        this.type = type;
        this.reportedEntityId = reportedEntityId;
        this.listing = listing;
        this.reportedUser = reportedUser;
        this.review = review;
        this.reason = reason;
        this.description = description;
        this.priority = priority;
        this.status = ReportStatus.PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static Report forListing(
            User reporter,
            Listing listing,
            ReportReason reason,
            String description,
            ReportPriority priority
    ) {
        return new Report(
                reporter, ReportType.LISTING, listing.getId(), listing, null, null,
                reason, description, priority
        );
    }

    public static Report forUser(
            User reporter,
            User reportedUser,
            ReportReason reason,
            String description,
            ReportPriority priority
    ) {
        return new Report(
                reporter, ReportType.USER, reportedUser.getId(), null, reportedUser, null,
                reason, description, priority
        );
    }

    public static Report forReview(
            User reporter,
            SellerReview review,
            ReportReason reason,
            String description,
            ReportPriority priority
    ) {
        return new Report(
                reporter, ReportType.REVIEW, review.getId(), null, null, review,
                reason, description, priority
        );
    }

    public void transition(ReportStatus nextStatus, User moderator, String response) {
        this.status = nextStatus;
        this.reviewedBy = moderator;
        this.adminResponse = response;
        this.reviewedAt = Instant.now();
        this.updatedAt = this.reviewedAt;
    }

    public Long getId() {
        return id;
    }

    public User getReporter() {
        return reporter;
    }

    public ReportType getType() {
        return type;
    }

    public Long getReportedEntityId() {
        return reportedEntityId;
    }

    public Listing getListing() {
        return listing;
    }

    public User getReportedUser() {
        return reportedUser;
    }

    public SellerReview getReview() {
        return review;
    }

    public ReportReason getReason() {
        return reason;
    }

    public String getDescription() {
        return description;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public ReportPriority getPriority() {
        return priority;
    }

    public String getAdminResponse() {
        return adminResponse;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
