package com.campushub.report;

import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.report.dto.ReportPageResponse;
import com.campushub.report.dto.ReportPageResponse.PaginationSummary;
import com.campushub.report.dto.ReportPageResponse.ReportItem;
import com.campushub.report.dto.ReportPageResponse.ReportStats;
import com.campushub.report.dto.ReportSubmissionRequest;
import com.campushub.report.dto.ReportSubmissionResponse;
import com.campushub.report.model.Report;
import com.campushub.report.model.ReportPriority;
import com.campushub.report.model.ReportReason;
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
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("(?<!\\d)(?:\\+?\\d[\\s-]?){10,13}(?!\\d)");
    private static final Set<ReportReason> LISTING_REASONS = EnumSet.of(
            ReportReason.FAKE_LISTING,
            ReportReason.WRONG_PRODUCT_DETAILS,
            ReportReason.MISLEADING_IMAGES,
            ReportReason.SUSPICIOUS_SELLER,
            ReportReason.STOLEN_ITEM_SUSPICION,
            ReportReason.PROHIBITED_ITEM,
            ReportReason.ABUSIVE_CONTENT,
            ReportReason.DUPLICATE_LISTING,
            ReportReason.PRICE_SCAM,
            ReportReason.OTHER
    );
    private static final Set<ReportReason> USER_REASONS = EnumSet.of(
            ReportReason.SUSPICIOUS_BEHAVIOR,
            ReportReason.FAKE_IDENTITY,
            ReportReason.SCAM_ATTEMPT,
            ReportReason.HARASSMENT,
            ReportReason.REPEATED_FAKE_LISTINGS,
            ReportReason.PAYMENT_RELATED_ISSUE,
            ReportReason.UNSAFE_PICKUP_BEHAVIOR,
            ReportReason.OTHER
    );
    private static final Set<ReportReason> REVIEW_REASONS = EnumSet.of(
            ReportReason.ABUSIVE_LANGUAGE,
            ReportReason.FAKE_REVIEW,
            ReportReason.SPAM,
            ReportReason.PERSONAL_INFORMATION_EXPOSED,
            ReportReason.IRRELEVANT_REVIEW,
            ReportReason.FALSE_CLAIM,
            ReportReason.OTHER
    );

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final SellerReviewRepository reviewRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;

    public ReportService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            SellerReviewRepository reviewRepository,
            ReportRepository reportRepository,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.reviewRepository = reviewRepository;
        this.reportRepository = reportRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReportSubmissionResponse reportListing(
            Long authenticatedUserId,
            Long listingId,
            ReportSubmissionRequest request
    ) {
        User reporter = loadActiveStudent(authenticatedUserId);
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .filter(item -> item.getCollege().isExplorable())
                .filter(item -> item.getSeller().getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This listing is no longer available."
                ));
        if (listing.getSeller().getId().equals(reporter.getId())) {
            throw new ForbiddenException("You cannot report your own listing.");
        }
        ReportReason reason = parseReason(request.reason(), LISTING_REASONS, "listing");
        return save(
                reporter,
                Report.forListing(
                        reporter,
                        listing,
                        reason,
                        normalizeDescription(request.description()),
                        priority(reason)
                ),
                listing.getTitle()
        );
    }

    @Transactional
    public ReportSubmissionResponse reportUser(
            Long authenticatedUserId,
            Long reportedUserId,
            ReportSubmissionRequest request
    ) {
        User reporter = loadActiveStudent(authenticatedUserId);
        User reportedUser = userRepository.findDashboardUserById(reportedUserId)
                .filter(user -> user.getRole() == UserRole.STUDENT)
                .filter(user -> user.getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "The student profile is no longer available."
                ));
        if (reportedUser.getId().equals(reporter.getId())) {
            throw new ForbiddenException("You cannot report your own account.");
        }
        ReportReason reason = parseReason(request.reason(), USER_REASONS, "user");
        return save(
                reporter,
                Report.forUser(
                        reporter,
                        reportedUser,
                        reason,
                        normalizeDescription(request.description()),
                        priority(reason)
                ),
                reportedUser.getFullName()
        );
    }

    @Transactional
    public ReportSubmissionResponse reportReview(
            Long authenticatedUserId,
            Long reviewId,
            ReportSubmissionRequest request
    ) {
        User reporter = loadActiveStudent(authenticatedUserId);
        SellerReview review = reviewRepository.findById(reviewId)
                .filter(item -> item.getStatus() == ReviewStatus.VISIBLE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "The review is no longer available."
                ));
        ReportReason reason = parseReason(request.reason(), REVIEW_REASONS, "review");
        return save(
                reporter,
                Report.forReview(
                        reporter,
                        review,
                        reason,
                        normalizeDescription(request.description()),
                        priority(reason)
                ),
                "review by " + review.getReviewer().getFullName()
        );
    }

    @Transactional(readOnly = true)
    public ReportPageResponse getMyReports(
            Long authenticatedUserId,
            String type,
            String status,
            Integer requestedPage,
            Integer requestedSize,
            String sortBy
    ) {
        User reporter = loadActiveStudent(authenticatedUserId);
        int page = requestedPage == null ? 0 : requestedPage;
        int size = requestedSize == null ? DEFAULT_PAGE_SIZE : requestedSize;
        validatePage(page, size);
        ReportType parsedType = parseType(type);
        ReportStatus parsedStatus = parseStatus(status);
        Specification<Report> filter = studentSpecification(
                reporter.getId(),
                parsedType,
                parsedStatus
        );
        Page<Report> result = reportRepository.findAll(
                filter,
                PageRequest.of(page, size, parseSort(sortBy))
        );
        return new ReportPageResponse(
                studentStats(reporter.getId()),
                result.getContent().stream().map(this::toItem).toList(),
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
    public ReportItem getMyReport(Long authenticatedUserId, Long reportId) {
        User reporter = loadActiveStudent(authenticatedUserId);
        Report report = reportRepository.findDetailedById(reportId)
                .filter(item -> item.getReporter().getId().equals(reporter.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Report was not found."));
        return toItem(report);
    }

    private ReportSubmissionResponse save(
            User reporter,
            Report report,
            String targetTitle
    ) {
        if (reportRepository.existsByReporterIdAndTypeAndReportedEntityId(
                reporter.getId(),
                report.getType(),
                report.getReportedEntityId()
        )) {
            throw new ResourceConflictException(
                    "You have already reported this "
                            + report.getType().name().toLowerCase(Locale.ROOT)
                            + ". You can track it in My Reports."
            );
        }
        Report saved = reportRepository.save(report);
        notificationService.notify(
                reporter,
                NotificationType.REPORT,
                NotificationPriority.MEDIUM,
                "Report submitted",
                "Your report about " + targetTitle + " has been submitted for review.",
                RelatedEntityType.REPORT,
                saved.getId(),
                "/student/reports"
        );
        return new ReportSubmissionResponse(
                saved.getId(),
                saved.getType().name(),
                saved.getReportedEntityId(),
                saved.getListing() == null ? null : saved.getListing().getId(),
                saved.getReason().name(),
                saved.getStatus().name(),
                saved.getPriority().name(),
                saved.getCreatedAt()
        );
    }

    private ReportReason parseReason(
            String value,
            Set<ReportReason> allowedReasons,
            String reportType
    ) {
        try {
            ReportReason reason = ReportReason.valueOf(
                    value.trim().toUpperCase(Locale.ROOT).replace(' ', '_')
            );
            if (!allowedReasons.contains(reason)) {
                throw new IllegalArgumentException();
            }
            return reason;
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported " + reportType + " report reason.");
        }
    }

    private String normalizeDescription(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim()
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "")
                .replaceAll("[ \\t]+", " ");
        if (normalized.length() > 500) {
            throw new BadRequestException("Report details must be 500 characters or fewer.");
        }
        if (EMAIL_PATTERN.matcher(normalized).find()
                || PHONE_PATTERN.matcher(normalized).find()) {
            throw new BadRequestException(
                    "Please remove email addresses and phone numbers from report details."
            );
        }
        return normalized;
    }

    private ReportPriority priority(ReportReason reason) {
        return switch (reason) {
            case PROHIBITED_ITEM, STOLEN_ITEM_SUSPICION, UNSAFE_PICKUP_BEHAVIOR ->
                    ReportPriority.CRITICAL;
            case FAKE_LISTING, SUSPICIOUS_SELLER, PRICE_SCAM, SCAM_ATTEMPT,
                    HARASSMENT, PAYMENT_RELATED_ISSUE, ABUSIVE_LANGUAGE,
                    PERSONAL_INFORMATION_EXPOSED, FALSE_CLAIM -> ReportPriority.HIGH;
            case DUPLICATE_LISTING, IRRELEVANT_REVIEW -> ReportPriority.LOW;
            default -> ReportPriority.MEDIUM;
        };
    }

    private Specification<Report> studentSpecification(
            Long reporterId,
            ReportType type,
            ReportStatus status
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("reporter").get("id"), reporterId));
            if (type != null) {
                predicates.add(builder.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private ReportStats studentStats(Long reporterId) {
        return new ReportStats(
                reportRepository.count(studentSpecification(reporterId, null, null)),
                reportRepository.count(studentSpecification(
                        reporterId, null, ReportStatus.PENDING
                )),
                reportRepository.count(studentSpecification(
                        reporterId, null, ReportStatus.UNDER_REVIEW
                )),
                reportRepository.count(studentSpecification(
                        reporterId, null, ReportStatus.ACTION_TAKEN
                )),
                reportRepository.count(studentSpecification(
                        reporterId, null, ReportStatus.REJECTED
                )),
                reportRepository.count(studentSpecification(
                        reporterId, null, ReportStatus.CLOSED
                ))
        );
    }

    private ReportItem toItem(Report report) {
        return new ReportItem(
                report.getId(),
                report.getType().name(),
                report.getReportedEntityId(),
                targetTitle(report),
                targetSubtitle(report),
                targetStatus(report),
                report.getReason().name(),
                report.getDescription(),
                report.getStatus().name(),
                report.getPriority().name(),
                report.getAdminResponse(),
                report.getCreatedAt(),
                report.getUpdatedAt()
        );
    }

    private String targetTitle(Report report) {
        return switch (report.getType()) {
            case LISTING -> report.getListing().getTitle();
            case USER -> report.getReportedUser().getFullName();
            case REVIEW -> "Review by " + report.getReview().getReviewer().getFullName();
        };
    }

    private String targetSubtitle(Report report) {
        return switch (report.getType()) {
            case LISTING -> "Seller: " + report.getListing().getSeller().getFullName();
            case USER -> report.getReportedUser().getCollege().getName();
            case REVIEW -> report.getReview().getOrder().getListing().getTitle();
        };
    }

    private String targetStatus(Report report) {
        return switch (report.getType()) {
            case LISTING -> report.getListing().getStatus().name();
            case USER -> report.getReportedUser().getStatus().name();
            case REVIEW -> report.getReview().getStatus().name();
        };
    }

    private ReportType parseType(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return ReportType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported report type.");
        }
    }

    private ReportStatus parseStatus(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return ReportStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported report status.");
        }
    }

    private Sort parseSort(String value) {
        if (value == null || value.isBlank() || value.equalsIgnoreCase("newest")) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        }
        if (value.equalsIgnoreCase("oldest")) {
            return Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));
        }
        throw new BadRequestException("Unsupported report sort option.");
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException(
                    "Page must be 0 or greater and size must be between 1 and "
                            + MAX_PAGE_SIZE + "."
            );
        }
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
                    "An active verified student account is required to submit reports."
            );
        }
        return user;
    }
}
