package com.campushub.superadmin.repository;

import com.campushub.superadmin.model.PlatformCategory;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PlatformCategoryRepository
        extends JpaRepository<PlatformCategory, Long>,
        JpaSpecificationExecutor<PlatformCategory> {

    boolean existsBySlugIgnoreCase(String slug);

    Optional<PlatformCategory> findBySlugIgnoreCase(String slug);

    @Override
    Page<PlatformCategory> findAll(
            Specification<PlatformCategory> specification,
            Pageable pageable
    );
}
