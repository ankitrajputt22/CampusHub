package com.campushub.college.repository;

import com.campushub.college.model.College;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollegeRepository extends JpaRepository<College, Long> {

    List<College> findTop25ByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String keyword);

    Optional<College> findByCodeIgnoreCase(String code);
}
