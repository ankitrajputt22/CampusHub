package com.campushub.auth.service;

import com.campushub.auth.dto.PasswordResetCompleteRequest;
import com.campushub.auth.dto.PasswordResetStartRequest;
import com.campushub.auth.dto.PasswordResetStartResponse;
import com.campushub.auth.dto.PasswordResetVerifyRequest;
import com.campushub.auth.dto.PasswordResetVerifyResponse;
import com.campushub.auth.model.PasswordResetChallenge;
import com.campushub.auth.repository.PasswordResetChallengeRepository;
import com.campushub.common.exception.BadRequestException;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_AFTER_SECONDS = 60;
    private static final Duration RESET_TOKEN_EXPIRY = Duration.ofMinutes(10);

    private final PasswordResetChallengeRepository challengeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final NotificationService notificationService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Duration otpExpiry;
    private final boolean exposeDevOtpCodes;

    public PasswordResetService(
            PasswordResetChallengeRepository challengeRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService,
            NotificationService notificationService,
            @Value("${app.otp.expiry-minutes}") long otpExpiryMinutes,
            @Value("${app.otp.expose-dev-codes}") boolean exposeDevOtpCodes
    ) {
        this.challengeRepository = challengeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.notificationService = notificationService;
        this.otpExpiry = Duration.ofMinutes(otpExpiryMinutes);
        this.exposeDevOtpCodes = exposeDevOtpCodes;
    }

    @Transactional
    public PasswordResetStartResponse start(PasswordResetStartRequest request) {
        String publicId = UUID.randomUUID().toString();
        User user = userRepository.findByEmailIgnoreCase(
                request.email().trim().toLowerCase(Locale.ROOT)
        ).filter(this::canRecover).orElse(null);
        String otp = null;
        if (user != null) {
            challengeRepository.invalidateActiveChallenges(
                    user.getId(),
                    Instant.now()
            );
            otp = String.format("%06d", secureRandom.nextInt(1_000_000));
            challengeRepository.save(new PasswordResetChallenge(
                    publicId,
                    user,
                    passwordEncoder.encode(otp),
                    Instant.now().plus(otpExpiry)
            ));
        }
        return new PasswordResetStartResponse(
                publicId,
                (int) otpExpiry.toSeconds(),
                RESEND_AFTER_SECONDS,
                exposeDevOtpCodes ? otp : null
        );
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public PasswordResetVerifyResponse verify(
            PasswordResetVerifyRequest request
    ) {
        PasswordResetChallenge challenge = loadChallenge(request.requestId());
        Instant now = Instant.now();
        if (challenge.getUsedAt() != null
                || challenge.getVerifiedAt() != null
                || !challenge.getExpiresAt().isAfter(now)
                || challenge.getAttempts() >= MAX_ATTEMPTS) {
            throw invalidChallenge();
        }
        if (!passwordEncoder.matches(request.otp(), challenge.getOtpHash())) {
            challenge.recordFailedAttempt();
            throw new BadRequestException(
                    "Recovery code is invalid. Please check the code and try again."
            );
        }

        String resetToken = randomToken();
        challenge.verify(
                sha256(resetToken),
                now.plus(RESET_TOKEN_EXPIRY)
        );
        return new PasswordResetVerifyResponse(
                challenge.getPublicId(),
                resetToken,
                (int) RESET_TOKEN_EXPIRY.toSeconds()
        );
    }

    @Transactional
    public void complete(PasswordResetCompleteRequest request) {
        PasswordResetChallenge challenge = loadChallenge(request.requestId());
        Instant now = Instant.now();
        if (challenge.getUsedAt() != null
                || challenge.getVerifiedAt() == null
                || challenge.getResetTokenHash() == null
                || challenge.getResetTokenExpiresAt() == null
                || !challenge.getResetTokenExpiresAt().isAfter(now)
                || !MessageDigest.isEqual(
                        challenge.getResetTokenHash().getBytes(StandardCharsets.UTF_8),
                        sha256(request.resetToken()).getBytes(StandardCharsets.UTF_8)
                )) {
            throw invalidChallenge();
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException(
                    "New password and confirmation do not match."
            );
        }
        User user = challenge.getUser();
        if (!canRecover(user)) {
            throw invalidChallenge();
        }
        if (passwordEncoder.matches(
                request.newPassword(),
                user.getPasswordHash()
        )) {
            throw new BadRequestException(
                    "New password must be different from your current password."
            );
        }

        user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenService.revokeAllForUser(user.getId());
        challenge.markUsed();
        notificationService.notify(
                user,
                NotificationType.SECURITY,
                NotificationPriority.HIGH,
                "Password reset completed",
                "Your Campus Hub password was reset successfully.",
                RelatedEntityType.PROFILE,
                user.getId(),
                "/student/profile"
        );
    }

    private PasswordResetChallenge loadChallenge(String publicId) {
        return challengeRepository.findByPublicId(publicId)
                .orElseThrow(this::invalidChallenge);
    }

    private boolean canRecover(User user) {
        return user.getStatus() == AccountStatus.ACTIVE
                && user.isEmailVerified()
                && user.isPhoneVerified();
    }

    private BadRequestException invalidChallenge() {
        return new BadRequestException(
                "Recovery request is invalid or expired. Please request a new code."
        );
    }

    private String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }
}
