package com.campushub.user.repository;

import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.model.UserRole;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository
        extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByPhoneNumber(String phoneNumber);

    Optional<User> findByEmailIgnoreCase(String email);

    long countByStatus(AccountStatus status);

    long countByRole(UserRole role);

    long countByRoleAndStatus(UserRole role, AccountStatus status);

    @EntityGraph(attributePaths = {"college", "trustScore"})
    List<User> findTop5ByRoleOrderByCreatedAtDesc(UserRole role);

    @EntityGraph(attributePaths = "college")
    List<User> findAllByRoleIn(List<UserRole> roles);

    @Override
    @EntityGraph(attributePaths = {"college", "trustScore"})
    Page<User> findAll(Specification<User> specification, Pageable pageable);

    long countByCollegeIdAndRoleAndStatusAndEmailVerifiedTrueAndPhoneVerifiedTrue(
            Long collegeId,
            UserRole role,
            AccountStatus status
    );

    @EntityGraph(attributePaths = "college")
    @Query("select user from User user where user.id = :id")
    Optional<User> findDashboardUserById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"college", "trustScore"})
    @Query("select user from User user where user.id = :id")
    Optional<User> findAdminUserById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"college", "trustScore"})
    @Query("select user from User user where user.id = :id")
    Optional<User> findChatUserById(@Param("id") Long id);
}
