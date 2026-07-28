package com.campushub.report.repository;

import com.campushub.report.model.Report;
import com.campushub.report.model.ReportType;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository
        extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    boolean existsByReporterIdAndTypeAndReportedEntityId(
            Long reporterId,
            ReportType type,
            Long entityId
    );

    long countByTypeAndReportedEntityId(ReportType type, Long entityId);

    @EntityGraph(attributePaths = {
            "reporter",
            "reporter.college",
            "listing",
            "listing.seller",
            "reportedUser",
            "reportedUser.college",
            "review",
            "review.reviewer",
            "review.reviewee",
            "review.order",
            "review.order.listing",
            "reviewedBy"
    })
    @Query("select report from Report report where report.id = :id")
    Optional<Report> findDetailedById(@Param("id") Long id);
}
