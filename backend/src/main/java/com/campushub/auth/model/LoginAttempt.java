package com.campushub.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String email;

    @Column(name = "ip_address", length = 80)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "successful", nullable = false)
    private boolean successful;

    @Column(name = "failure_reason", length = 120)
    private String failureReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected LoginAttempt() {
    }

    public LoginAttempt(
            String email,
            String ipAddress,
            String userAgent,
            boolean successful,
            String failureReason
    ) {
        this.email = email;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.successful = successful;
        this.failureReason = failureReason;
        this.createdAt = Instant.now();
    }
}
