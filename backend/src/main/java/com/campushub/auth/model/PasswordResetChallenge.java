package com.campushub.auth.model;

import com.campushub.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "password_reset_challenges")
public class PasswordResetChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "reset_token_hash", length = 100)
    private String resetTokenHash;

    @Column(name = "reset_token_expires_at")
    private Instant resetTokenExpiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PasswordResetChallenge() {
    }

    public PasswordResetChallenge(
            String publicId,
            User user,
            String otpHash,
            Instant expiresAt
    ) {
        this.publicId = publicId;
        this.user = user;
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public String getPublicId() {
        return publicId;
    }

    public User getUser() {
        return user;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public int getAttempts() {
        return attempts;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public String getResetTokenHash() {
        return resetTokenHash;
    }

    public Instant getResetTokenExpiresAt() {
        return resetTokenExpiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public void recordFailedAttempt() {
        attempts++;
    }

    public void verify(String tokenHash, Instant tokenExpiresAt) {
        verifiedAt = Instant.now();
        resetTokenHash = tokenHash;
        resetTokenExpiresAt = tokenExpiresAt;
    }

    public void markUsed() {
        usedAt = Instant.now();
        resetTokenHash = null;
        resetTokenExpiresAt = null;
    }
}
