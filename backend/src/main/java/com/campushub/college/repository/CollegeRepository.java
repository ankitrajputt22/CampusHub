package com.campushub.college.repository;

import com.campushub.college.model.College;
import com.campushub.college.model.CollegeStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CollegeRepository
        extends JpaRepository<College, Long>, JpaSpecificationExecutor<College> {

    List<College> findTop25ByActiveTrueAndStatusAndNameContainingIgnoreCaseOrderByNameAsc(
            CollegeStatus status,
            String keyword
    );

    Optional<College> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    long countByStatus(CollegeStatus status);

    @Query("""
            select college
            from College college
            where college.active = true
              and college.status = :status
              and college.id <> :excludedCollegeId
              and (
                    :keyword = ''
                    or lower(college.name) like lower(concat('%', :keyword, '%'))
                    or lower(college.code) like lower(concat('%', :keyword, '%'))
                    or lower(college.city) like lower(concat('%', :keyword, '%'))
                    or lower(college.state) like lower(concat('%', :keyword, '%'))
                    or lower(college.emailDomain) like lower(concat('%', :keyword, '%'))
              )
            order by college.name asc
            """)
    List<College> findExplorableColleges(
            @Param("excludedCollegeId") Long excludedCollegeId,
            @Param("status") CollegeStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
