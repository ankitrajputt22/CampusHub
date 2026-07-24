package com.campushub.report;

import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ForbiddenException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.listing.model.Listing;
import com.campushub.listing.model.ListingStatus;
import com.campushub.listing.repository.ListingRepository;
import com.campushub.report.dto.ListingReportRequest;
import com.campushub.report.dto.ListingReportResponse;
import com.campushub.report.model.ListingReport;
import com.campushub.report.model.ListingReportReason;
import com.campushub.report.repository.ListingReportRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import com.campushub.user.repository.UserRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListingReportService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ListingReportRepository reportRepository;

    public ListingReportService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            ListingReportRepository reportRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.reportRepository = reportRepository;
    }

    @Transactional
    public ListingReportResponse report(
            Long authenticatedUserId,
            Long listingId,
            ListingReportRequest request
    ) {
        User reporter = loadActiveStudent(authenticatedUserId);
        Listing listing = listingRepository.findMarketplaceListingById(listingId)
                .filter(item -> item.getStatus() == ListingStatus.ACTIVE)
                .filter(item -> item.getCollege().getId().equals(reporter.getCollege().getId()))
                .filter(item -> item.getSeller().getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This listing is unavailable in your college marketplace."
                ));
        if (listing.getSeller().getId().equals(reporter.getId())) {
            throw new ForbiddenException("You cannot report your own listing.");
        }
        if (reportRepository.existsByReporterIdAndListingId(reporter.getId(), listingId)) {
            throw new ResourceConflictException(
                    "You have already reported this listing. It is awaiting review."
            );
        }

        ListingReport report = reportRepository.save(new ListingReport(
                listing,
                reporter,
                parseReason(request.reason()),
                normalizeDescription(request.description())
        ));
        return new ListingReportResponse(
                report.getId(),
                listingId,
                report.getReason().name(),
                report.getStatus().name(),
                report.getCreatedAt()
        );
    }

    private ListingReportReason parseReason(String reason) {
        try {
            return ListingReportReason.valueOf(
                    reason.trim().toUpperCase(Locale.ROOT).replace(' ', '_')
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Unsupported listing report reason.");
        }
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim().replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");
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
