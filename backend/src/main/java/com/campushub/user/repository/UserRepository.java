package com.campushub.user.repository;

import com.campushub.user.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "college")
    @Query("select user from User user where user.id = :id")
    Optional<User> findDashboardUserById(@Param("id") Long id);
}
