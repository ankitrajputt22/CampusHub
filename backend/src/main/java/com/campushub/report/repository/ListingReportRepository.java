package com.campushub.report.repository;

import com.campushub.report.model.ListingReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListingReportRepository extends JpaRepository<ListingReport, Long> {

    boolean existsByReporterIdAndListingId(Long reporterId, Long listingId);
}
