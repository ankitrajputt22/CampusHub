package com.campushub.moderation;

import com.campushub.admin.AdminAccessService;
import com.campushub.admin.AdminAuditLogService;
import com.campushub.auth.service.RefreshTokenService;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.moderation.dto.ModerationRequest;
import com.campushub.moderation.dto.ModerationResultResponse;
import com.campushub.moderation.dto.ReportStatusRequest;
import com.campushub.moderation.model.ModerationAction;
import com.campushub.moderation.model.ModerationActionType;
import com.campushub.moderation.model.ModerationTargetType;
import com.campushub.moderation.repository.ModerationActionRepository;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.report.dto.AdminReportDetailsResponse;
import com.campushub.report.dto.AdminReportDetailsResponse.ModerationHistoryItem;
import com.campushub.report.dto.AdminReportDetailsResponse.ReporterSummary;
import com.campushub.report.dto.AdminReportDetailsResponse.TargetSummary;
import com.campushub.report.dto.AdminReportPageResponse;
import com.campushub.report.dto.AdminReportPageResponse.PaginationSummary;
import com.campushub.report.dto.AdminReportPageResponse.QueueItem;
import com.campushub.report.dto.AdminReportPageResponse.QueueStats;
import com.campushub.report.model.Report;
import com.campushub.report.model.ReportPriority;
import com.campushub.report.model.ReportStatus;
import com.campushub.report.model.ReportType;
import com.campushub.report.repository.ReportRepository;
import com.campushub.review.model.ReviewStatus;
import com.campushub.review.model.SellerReview;
import com.campushub.review.repository.SellerReviewRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScoreService;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModerationService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final AdminAccessService adminAccessService;
    private final AdminAuditLogService auditLogService;
    private final ListingRepository listingRepository;
    private final SellerReviewRepository reviewRepository;
    private final ReportRepository reportRepository;
    private final ModerationActionRepository actionRepository;
    private final NotificationService notificationService;
    private final RefreshTokenService refreshTokenService;
    private final TrustScoreService trustScoreService;

    public ModerationService(
            UserRepository userRepository,
            AdminAccessService adminAccessService,
            AdminAuditLogService auditLogService,
            ListingRepository listingRepository,
            SellerReviewRepository reviewRepository,
            ReportRepository reportRepository,
            ModerationActionRepository actionRepository,
            NotificationService notificationService,
            RefreshTokenService refreshTokenService,
            TrustScoreService trustScoreService
    ) {
        this.userRepository = userRepository;
        this.adminAccessService = adminAccessService;
        this.auditLogService = auditLogService;
        this.listingRepository = listingRepository;
        this.reviewRepository = reviewRepository;
        this.reportRepository = reportRepository;
        this.actionRepository = actionRepository;
        this.notificationService = notificationService;
        this.refreshTokenService = refreshTokenService;
        this.trustScoreService = trustScoreService;
    }

    @Transactional(readOnly = true)
    public AdminReportPageResponse getQueue(
            Long authenticatedUserId,
            String type,
            String status,
            String priority,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        loadModerator(authenticatedUserId);
        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? DEFAULT_PAGE_SIZE : requestedSize;
        validatePage(page, size);
        Specification<Report> filter = specification(
                parseEnum(type, ReportType.class, "report type"),
                parseEnum(status, ReportStatus.class, "report status"),
                parseEnum(priority, ReportPriority.class, "report priority")
        );
        Page<Report> result = reportRepository.findAll(
                filter,
                PageRequest.of(page, size, parseSort(sortBy))
        );
        return new AdminReportPageResponse(
                queueStats(),
                result.getContent().stream().map(this::toQueueItem).toList(),
                new PaginationSummary(
                        result.getNumber(),
                        result.getSize(),
                        result.getTotalElements(),
                        result.getTotalPages(),
                        result.hasNext()
                )
        );
    }

    @Transactional(readOnly = true)
    public AdminReportDetailsResponse getReport(
            Long authenticatedUserId,
            Long reportId
    ) {
        loadModerator(authenticatedUserId);
        Report report = loadDetailedReport(reportId);
        List<ModerationHistoryItem> history = actionRepository
                .findAllByReportIdOrderByCreatedAtAsc(reportId)
                .stream()
                .map(action -> new ModerationHistoryItem(
                        action.getId(),
                        action.getActionType().name(),
                        action.getTargetType().name(),
                        action.getTargetId(),
                        action.getPreviousState(),
                        action.getNewState(),
                        action.getNote(),
                        action.getModerator().getFullName(),
                        action.getCreatedAt()
                ))
                .toList();
        return new AdminReportDetailsResponse(
                report.getId(),
                report.getType().name(),
                report.getReportedEntityId(),
                report.getReason().name(),
                report.getDescription(),
                report.getStatus().name(),
                report.getPriority().name(),
                report.getAdminResponse(),
                report.getCreatedAt(),
                report.getUpdatedAt(),
                report.getReviewedAt(),
                new ReporterSummary(
                        report.getReporter().getId(),
                        report.getReporter().getFullName(),
                        report.getReporter().getCollege().getName()
                ),
                target(report),
                Math.max(0, reportRepository.countByTypeAndReportedEntityId(
                        report.getType(),
                        report.getReportedEntityId()
                ) - 1),
                history
        );
    }

    @Transactional
    public ModerationResultResponse markUnderReview(
            Long authenticatedUserId,
            Long reportId,
            ReportStatusRequest request
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = loadDetailedReport(reportId);
        if (report.getStatus() != ReportStatus.PENDING) {
            throw new ResourceConflictException(
                    "Only pending reports can be moved under review."
            );
        }
        return transitionReport(
                report,
                moderator,
                ReportStatus.UNDER_REVIEW,
                ModerationActionType.REPORT_UNDER_REVIEW,
                normalizeNote(request.note()),
                "Your report is now being reviewed.",
                "Report moved under review"
        );
    }

    @Transactional
    public ModerationResultResponse reject(
            Long authenticatedUserId,
            Long reportId,
            ReportStatusRequest request
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = loadDetailedReport(reportId);
        requireOpenReport(report);
        String note = normalizeRequiredNote(
                request.note(),
                "Please explain why the report is being rejected."
        );
        return transitionReport(
                report,
                moderator,
                ReportStatus.REJECTED,
                ModerationActionType.REPORT_REJECTED,
                note,
                "Your report was reviewed and no policy violation was confirmed. "
                        + note,
                "Report rejected"
        );
    }

    @Transactional
    public ModerationResultResponse close(
            Long authenticatedUserId,
            Long reportId,
            ReportStatusRequest request
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = loadDetailedReport(reportId);
        if (report.getStatus() == ReportStatus.CLOSED) {
            throw new ResourceConflictException("This report is already closed.");
        }
        String note = normalizeNote(request.note());
        return transitionReport(
                report,
                moderator,
                ReportStatus.CLOSED,
                ModerationActionType.REPORT_CLOSED,
                note,
                "Your report has been closed."
                        + (note == null ? "" : " " + note),
                "Report closed"
        );
    }

    @Transactional
    public ModerationResultResponse markListingUnderReview(
            Long authenticatedUserId,
            Long listingId,
            ModerationRequest request
    ) {
        return updateListing(
                authenticatedUserId,
                listingId,
                request,
                ListingStatus.UNDER_REVIEW,
                ModerationActionType.LISTING_UNDER_REVIEW,
                "Listing under review",
                "Your listing has been temporarily removed while a safety report is reviewed."
        );
    }

    @Transactional
    public ModerationResultResponse blockListing(
            Long authenticatedUserId,
            Long listingId,
            ModerationRequest request
    ) {
        return updateListing(
                authenticatedUserId,
                listingId,
                request,
                ListingStatus.BLOCKED,
                ModerationActionType.LISTING_BLOCKED,
                "Listing blocked",
                "Your listing was blocked after a moderator confirmed a policy violation."
        );
    }

    @Transactional
    public ModerationResultResponse restoreListing(
            Long authenticatedUserId,
            Long listingId,
            ModerationRequest request
    ) {
        return updateListing(
                authenticatedUserId,
                listingId,
                request,
                ListingStatus.ACTIVE,
                ModerationActionType.LISTING_RESTORED,
                "Listing restored",
                "Your listing has been restored and is visible in the marketplace again."
        );
    }

    @Transactional
    public ModerationResultResponse softDeleteListing(
            Long authenticatedUserId,
            Long listingId,
            ModerationRequest request
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = matchingReport(
                request.reportId(),
                ReportType.LISTING,
                listingId
        );
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Listing was not found."
                ));
        ListingStatus previous = listing.getStatus();
        if (previous == ListingStatus.DELETED || previous == ListingStatus.SOLD) {
            throw new ResourceConflictException(
                    "A sold or deleted listing cannot be soft deleted."
            );
        }
        String note = normalizeRequiredNote(
                request.note(),
                "Please explain why this listing is being removed."
        );
        listing.changeStatus(ListingStatus.DELETED);
        saveAction(
                report,
                moderator,
                ModerationActionType.LISTING_DELETED,
                ModerationTargetType.LISTING,
                listing.getId(),
                previous.name(),
                ListingStatus.DELETED.name(),
                note
        );
        completeWithAction(report, moderator, note);
        notifyAction(
                report,
                listing.getSeller(),
                "Listing removed",
                "Your listing was removed from Campus Hub after an administrator review.",
                RelatedEntityType.LISTING,
                listing.getId(),
                "/student/my-marketplace"
        );
        trustScoreService.recalculateAndSave(
                listing.getSeller().getId(), "MODERATION", listing.getId(),
                "Listing moderation action: LISTING_DELETED", true
        );
        return result(
                report,
                ModerationActionType.LISTING_DELETED,
                ModerationTargetType.LISTING,
                listing.getId(),
                ListingStatus.DELETED.name()
        );
    }

    @Transactional
    public ModerationResultResponse markReviewUnderReview(
            Long authenticatedUserId,
            Long reviewId,
            ModerationRequest request
    ) {
        return updateReview(
                authenticatedUserId,
                reviewId,
                request,
                ReviewStatus.UNDER_REVIEW,
                ModerationActionType.REVIEW_UNDER_REVIEW,
                "Review under review",
                "Your review is temporarily hidden while a safety report is reviewed."
        );
    }

    @Transactional
    public ModerationResultResponse hideReview(
            Long authenticatedUserId,
            Long reviewId,
            ModerationRequest request
    ) {
        return updateReview(
                authenticatedUserId,
                reviewId,
                request,
                ReviewStatus.HIDDEN,
                ModerationActionType.REVIEW_HIDDEN,
                "Review hidden",
                "Your review was hidden after a moderator confirmed a policy violation."
        );
    }

    @Transactional
    public ModerationResultResponse restoreReview(
            Long authenticatedUserId,
            Long reviewId,
            ModerationRequest request
    ) {
        return updateReview(
                authenticatedUserId,
                reviewId,
                request,
                ReviewStatus.VISIBLE,
                ModerationActionType.REVIEW_RESTORED,
                "Review restored",
                "Your review has been restored."
        );
    }

    @Transactional
    public ModerationResultResponse warnUser(
            Long authenticatedUserId,
            Long userId,
            ModerationRequest request
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = matchingReport(request.reportId(), ReportType.USER, userId);
        User target = loadModeratableStudent(userId);
        String note = normalizeRequiredNote(
                request.note(),
                "A warning must include clear guidance for the student."
        );
        saveAction(
                report,
                moderator,
                ModerationActionType.USER_WARNED,
                ModerationTargetType.USER,
                target.getId(),
                target.getStatus().name(),
                target.getStatus().name(),
                note
        );
        completeWithAction(report, moderator, note);
        notifyAction(
                report,
                target,
                "Campus Hub policy warning",
                note,
                RelatedEntityType.USER,
                target.getId(),
                "/student/notifications"
        );
        return result(
                report,
                ModerationActionType.USER_WARNED,
                ModerationTargetType.USER,
                target.getId(),
                target.getStatus().name()
        );
    }

    @Transactional
    public ModerationResultResponse suspendUser(
            Long authenticatedUserId,
            Long userId,
            ModerationRequest request
    ) {
        return updateUserStatus(
                authenticatedUserId,
                userId,
                request,
                AccountStatus.SUSPENDED,
                ModerationActionType.USER_SUSPENDED,
                "Account suspended",
                "Your account was suspended after a moderator confirmed a policy violation."
        );
    }

    @Transactional
    public ModerationResultResponse blockUser(
            Long authenticatedUserId,
            Long userId,
            ModerationRequest request
    ) {
        return updateUserStatus(
                authenticatedUserId,
                userId,
                request,
                AccountStatus.BLOCKED,
                ModerationActionType.USER_BLOCKED,
                "Account blocked",
                "Your account was blocked after a moderator confirmed a serious policy violation."
        );
    }

    @Transactional
    public ModerationResultResponse reactivateUser(
            Long authenticatedUserId,
            Long userId,
            ModerationRequest request
    ) {
        return updateUserStatus(
                authenticatedUserId,
                userId,
                request,
                AccountStatus.ACTIVE,
                ModerationActionType.USER_REACTIVATED,
                "Account reactivated",
                "Your account has been reactivated."
        );
    }

    private ModerationResultResponse transitionReport(
            Report report,
            User moderator,
            ReportStatus nextStatus,
            ModerationActionType actionType,
            String note,
            String notificationMessage,
            String resultAction
    ) {
        ReportStatus previous = report.getStatus();
        report.transition(nextStatus, moderator, note);
        saveAction(
                report,
                moderator,
                actionType,
                ModerationTargetType.REPORT,
                report.getId(),
                previous.name(),
                nextStatus.name(),
                note
        );
        notificationService.notify(
                report.getReporter(),
                NotificationType.REPORT,
                notificationPriority(report.getPriority()),
                "Report status updated",
                notificationMessage,
                RelatedEntityType.REPORT,
                report.getId(),
                "/student/reports"
        );
        return result(
                report,
                resultAction,
                ModerationTargetType.REPORT,
                report.getId(),
                nextStatus.name()
        );
    }

    private ModerationResultResponse updateListing(
            Long authenticatedUserId,
            Long listingId,
            ModerationRequest request,
            ListingStatus nextStatus,
            ModerationActionType actionType,
            String title,
            String targetMessage
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = matchingReport(request.reportId(), ReportType.LISTING, listingId);
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing was not found."));
        ListingStatus previous = listing.getStatus();
        validateListingTransition(previous, nextStatus);
        listing.changeStatus(nextStatus);
        String note = normalizeNote(request.note());
        saveAction(
                report,
                moderator,
                actionType,
                ModerationTargetType.LISTING,
                listing.getId(),
                previous.name(),
                nextStatus.name(),
                note
        );
        completeWithAction(report, moderator, note);
        notifyAction(
                report,
                listing.getSeller(),
                title,
                targetMessage,
                RelatedEntityType.LISTING,
                listing.getId(),
                "/student/my-marketplace"
        );
        return result(
                report,
                actionType,
                ModerationTargetType.LISTING,
                listing.getId(),
                nextStatus.name()
        );
    }

    private ModerationResultResponse updateReview(
            Long authenticatedUserId,
            Long reviewId,
            ModerationRequest request,
            ReviewStatus nextStatus,
            ModerationActionType actionType,
            String title,
            String targetMessage
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = matchingReport(request.reportId(), ReportType.REVIEW, reviewId);
        SellerReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review was not found."));
        ReviewStatus previous = review.getStatus();
        if (previous == nextStatus || previous == ReviewStatus.DELETED) {
            throw new ResourceConflictException(
                    "The review cannot be moved to the requested status."
            );
        }
        review.changeStatus(nextStatus);
        String note = normalizeNote(request.note());
        saveAction(
                report,
                moderator,
                actionType,
                ModerationTargetType.REVIEW,
                review.getId(),
                previous.name(),
                nextStatus.name(),
                note
        );
        completeWithAction(report, moderator, note);
        notifyAction(
                report,
                review.getReviewer(),
                title,
                targetMessage,
                RelatedEntityType.REVIEW,
                review.getId(),
                "/student/reviews"
        );
        trustScoreService.recalculateAndSave(
                review.getReviewee().getId(), "MODERATION", review.getId(),
                "Review moderation action: " + actionType.name(), true
        );
        return result(
                report,
                actionType,
                ModerationTargetType.REVIEW,
                review.getId(),
                nextStatus.name()
        );
    }

    private ModerationResultResponse updateUserStatus(
            Long authenticatedUserId,
            Long userId,
            ModerationRequest request,
            AccountStatus nextStatus,
            ModerationActionType actionType,
            String title,
            String targetMessage
    ) {
        User moderator = loadModerator(authenticatedUserId);
        Report report = matchingReport(request.reportId(), ReportType.USER, userId);
        User target = loadModeratableStudent(userId);
        AccountStatus previous = target.getStatus();
        validateUserTransition(previous, nextStatus);
        target.changeStatus(nextStatus);
        String note = normalizeNote(request.note());
        saveAction(
                report,
                moderator,
                actionType,
                ModerationTargetType.USER,
                target.getId(),
                previous.name(),
                nextStatus.name(),
                note
        );
        if (nextStatus == AccountStatus.BLOCKED) {
            for (Listing listing : listingRepository.findAllBySellerIdAndStatus(
                    target.getId(),
                    ListingStatus.ACTIVE
            )) {
                listing.changeStatus(ListingStatus.BLOCKED);
                auditLogService.record(
                        moderator,
                        ModerationActionType.LISTING_BLOCKED.name(),
                        ModerationTargetType.LISTING.name(),
                        listing.getId(),
                        ListingStatus.ACTIVE.name(),
                        ListingStatus.BLOCKED.name(),
                        "Automatically blocked because the seller account was blocked."
                );
            }
        }
        completeWithAction(report, moderator, note);
        notifyAction(
                report,
                target,
                title,
                targetMessage,
                RelatedEntityType.USER,
                target.getId(),
                "/student/notifications"
        );
        if (nextStatus == AccountStatus.SUSPENDED || nextStatus == AccountStatus.BLOCKED) {
            refreshTokenService.revokeAllForUser(target.getId());
        }
        trustScoreService.recalculateAndSave(
                target.getId(), "MODERATION", target.getId(),
                "Account moderation action: " + actionType.name(), true
        );
        return result(
                report,
                actionType,
                ModerationTargetType.USER,
                target.getId(),
                nextStatus.name()
        );
    }

    private void completeWithAction(Report report, User moderator, String note) {
        if (report == null) {
            return;
        }
        report.transition(ReportStatus.ACTION_TAKEN, moderator, note);
        notificationService.notify(
                report.getReporter(),
                NotificationType.REPORT,
                notificationPriority(report.getPriority()),
                "Action taken on your report",
                "A moderator reviewed your report and took an appropriate action.",
                RelatedEntityType.REPORT,
                report.getId(),
                "/student/reports"
        );
    }

    private void notifyAction(
            Report report,
            User target,
            String title,
            String message,
            RelatedEntityType entityType,
            Long entityId,
            String actionUrl
    ) {
        notificationService.notify(
                target,
                NotificationType.ADMIN,
                report == null
                        ? NotificationPriority.MEDIUM
                        : notificationPriority(report.getPriority()),
                title,
                message,
                entityType,
                entityId,
                actionUrl
        );
    }

    private Report matchingReport(Long reportId, ReportType type, Long entityId) {
        if (reportId == null) {
            return null;
        }
        Report report = loadDetailedReport(reportId);
        if (report.getType() != type
                || !report.getReportedEntityId().equals(entityId)) {
            throw new BadRequestException(
                    "The report does not match the moderation target."
            );
        }
        if (report.getStatus() == ReportStatus.REJECTED
                || report.getStatus() == ReportStatus.CLOSED) {
            throw new ResourceConflictException(
                    "A rejected or closed report cannot be used for moderation."
            );
        }
        return report;
    }

    private void validateListingTransition(
            ListingStatus previous,
            ListingStatus next
    ) {
        if (previous == next || previous == ListingStatus.DELETED
                || previous == ListingStatus.SOLD) {
            throw new ResourceConflictException(
                    "The listing cannot be moved to the requested status."
            );
        }
        if (next == ListingStatus.ACTIVE
                && previous != ListingStatus.BLOCKED
                && previous != ListingStatus.UNDER_REVIEW) {
            throw new ResourceConflictException(
                    "Only blocked or under-review listings can be restored."
            );
        }
    }

    private void validateUserTransition(
            AccountStatus previous,
            AccountStatus next
    ) {
        if (previous == next) {
            throw new ResourceConflictException(
                    "The account is already in the requested status."
            );
        }
        if (next == AccountStatus.ACTIVE
                && previous != AccountStatus.SUSPENDED
                && previous != AccountStatus.BLOCKED) {
            throw new ResourceConflictException(
                    "Only suspended or blocked accounts can be reactivated."
            );
        }
    }

    private void requireOpenReport(Report report) {
        if (report.getStatus() != ReportStatus.PENDING
                && report.getStatus() != ReportStatus.UNDER_REVIEW) {
            throw new ResourceConflictException(
                    "Only pending or under-review reports can be rejected."
            );
        }
    }

    private Report loadDetailedReport(Long reportId) {
        return reportRepository.findDetailedById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report was not found."));
    }

    private User loadModerator(Long userId) {
        return adminAccessService.requireActiveAdmin(userId);
    }

    private User loadModeratableStudent(Long userId) {
        return userRepository.findDashboardUserById(userId)
                .filter(user -> user.getRole() == UserRole.STUDENT)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student account was not found."
                ));
    }

    private Specification<Report> specification(
            ReportType type,
            ReportStatus status,
            ReportPriority priority
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (type != null) {
                predicates.add(builder.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(builder.equal(root.get("priority"), priority));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private QueueStats queueStats() {
        long actionTaken = reportRepository.count(
                specification(null, ReportStatus.ACTION_TAKEN, null)
        );
        long rejected = reportRepository.count(
                specification(null, ReportStatus.REJECTED, null)
        );
        long closed = reportRepository.count(
                specification(null, ReportStatus.CLOSED, null)
        );
        return new QueueStats(
                reportRepository.count(),
                reportRepository.count(
                        specification(null, ReportStatus.PENDING, null)
                ),
                reportRepository.count(
                        specification(null, ReportStatus.UNDER_REVIEW, null)
                ),
                reportRepository.count(
                        specification(null, null, ReportPriority.CRITICAL)
                ),
                actionTaken + rejected + closed
        );
    }

    private QueueItem toQueueItem(Report report) {
        TargetSummary target = target(report);
        return new QueueItem(
                report.getId(),
                report.getType().name(),
                report.getReportedEntityId(),
                target.title(),
                target.status(),
                report.getReporter().getFullName(),
                report.getReporter().getCollege().getName(),
                report.getReason().name(),
                report.getStatus().name(),
                report.getPriority().name(),
                report.getCreatedAt(),
                report.getUpdatedAt()
        );
    }

    private TargetSummary target(Report report) {
        return switch (report.getType()) {
            case LISTING -> new TargetSummary(
                    report.getListing().getId(),
                    report.getListing().getTitle(),
                    report.getListing().getCategory(),
                    report.getListing().getStatus().name(),
                    report.getListing().getSeller().getId(),
                    report.getListing().getSeller().getFullName()
            );
            case USER -> new TargetSummary(
                    report.getReportedUser().getId(),
                    report.getReportedUser().getFullName(),
                    report.getReportedUser().getCollege().getName(),
                    report.getReportedUser().getStatus().name(),
                    report.getReportedUser().getId(),
                    report.getReportedUser().getFullName()
            );
            case REVIEW -> new TargetSummary(
                    report.getReview().getId(),
                    "Review by " + report.getReview().getReviewer().getFullName(),
                    report.getReview().getOrder().getListing().getTitle(),
                    report.getReview().getStatus().name(),
                    report.getReview().getReviewer().getId(),
                    report.getReview().getReviewer().getFullName()
            );
        };
    }

    private <T extends Enum<T>> T parseEnum(
            String value,
            Class<T> enumType,
            String label
    ) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return Enum.valueOf(
                    enumType,
                    value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported " + label + ".");
        }
    }

    private Sort parseSort(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("newest")) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        }
        if (value.equalsIgnoreCase("oldest")) {
            return Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));
        }
        if (value.equalsIgnoreCase("priority")) {
            return Sort.by(
                    Sort.Order.asc("priority"),
                    Sort.Order.desc("createdAt")
            );
        }
        throw new BadRequestException("Unsupported moderation queue sort option.");
    }

    private String normalizeNote(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim()
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");
        if (normalized.length() > 500) {
            throw new BadRequestException("Moderator notes must be 500 characters or fewer.");
        }
        return normalized;
    }

    private String normalizeRequiredNote(String value, String message) {
        String normalized = normalizeNote(value);
        if (normalized == null) {
            throw new BadRequestException(message);
        }
        return normalized;
    }

    private NotificationPriority notificationPriority(ReportPriority priority) {
        return switch (priority) {
            case CRITICAL, HIGH -> NotificationPriority.HIGH;
            case MEDIUM -> NotificationPriority.MEDIUM;
            case LOW -> NotificationPriority.LOW;
        };
    }

    private ModerationResultResponse result(
            Report report,
            ModerationActionType action,
            ModerationTargetType targetType,
            Long targetId,
            String targetStatus
    ) {
        return result(report, action.name(), targetType, targetId, targetStatus);
    }

    private ModerationResultResponse result(
            Report report,
            String action,
            ModerationTargetType targetType,
            Long targetId,
            String targetStatus
    ) {
        return new ModerationResultResponse(
                report == null ? null : report.getId(),
                report == null ? null : report.getStatus().name(),
                action,
                targetType.name(),
                targetId,
                targetStatus,
                Instant.now()
        );
    }

    private void saveAction(
            Report report,
            User moderator,
            ModerationActionType actionType,
            ModerationTargetType targetType,
            Long targetId,
            String previousState,
            String newState,
            String note
    ) {
        if (report != null) {
            actionRepository.save(new ModerationAction(
                    report,
                    moderator,
                    actionType,
                    targetType,
                    targetId,
                    previousState,
                    newState,
                    note
            ));
        }
        auditLogService.record(
                moderator,
                actionType.name(),
                targetType.name(),
                targetId,
                previousState,
                newState,
                note
        );
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException(
                    "Page must be 0 or greater and size must be between 1 and "
                            + MAX_PAGE_SIZE + "."
            );
        }
    }
}
