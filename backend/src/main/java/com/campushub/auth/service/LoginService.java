package com.campushub.auth.service;

import com.campushub.auth.dto.AuthUserResponse;
import com.campushub.auth.dto.LoginRequest;
import com.campushub.auth.dto.LoginResponse;
import com.campushub.auth.model.LoginAttempt;
import com.campushub.auth.repository.LoginAttemptRepository;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScoreRepository;
import java.time.Instant;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final String INVALID_CREDENTIALS = "Invalid email or password.";

    private final UserRepository userRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final RefreshTokenService refreshTokenService;

    public LoginService(
            UserRepository userRepository,
            TrustScoreRepository trustScoreRepository,
            LoginAttemptRepository loginAttemptRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService,
            RefreshTokenService refreshTokenService
    ) {
        this.userRepository = userRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            recordAttempt(email, ipAddress, userAgent, false, "USER_NOT_FOUND");
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        if (isLocked(user)) {
            recordAttempt(email, ipAddress, userAgent, false, "ACCOUNT_LOCKED");
            throw new UnauthorizedException("Too many failed attempts. Please try again after 15 minutes.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.recordFailedLogin(MAX_FAILED_ATTEMPTS, Instant.now().plusSeconds(LOCK_MINUTES * 60L));
            recordAttempt(email, ipAddress, userAgent, false, "INVALID_PASSWORD");
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        validateAccountCanLogin(user, email, ipAddress, userAgent);

        user.recordSuccessfulLogin();
        recordAttempt(email, ipAddress, userAgent, true, null);

        String accessToken = jwtTokenService.createAccessToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user, request.rememberMe());
        int trustScore = trustScoreRepository.findByUserId(user.getId())
                .map(score -> score.getScore())
                .orElse(0);

        return new LoginResponse(
                accessToken,
                refreshToken,
                new AuthUserResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getCollege().getId(),
                        user.getCollege().getName(),
                        user.getRole().name(),
                        user.getStatus().name(),
                        trustScore
                )
        );
    }

    private void validateAccountCanLogin(User user, String email, String ipAddress, String userAgent) {
        if (user.getStatus() == AccountStatus.BLOCKED) {
            recordAttempt(email, ipAddress, userAgent, false, "BLOCKED");
            throw new UnauthorizedException("Your account has been blocked. Please contact support.");
        }

        if (user.getStatus() == AccountStatus.SUSPENDED) {
            recordAttempt(email, ipAddress, userAgent, false, "SUSPENDED");
            throw new UnauthorizedException("Your account has been suspended due to policy violations.");
        }

        if (user.getStatus() == AccountStatus.PENDING_VERIFICATION) {
            recordAttempt(email, ipAddress, userAgent, false, "PENDING_VERIFICATION");
            throw new UnauthorizedException("Your account verification is incomplete. Please complete OTP verification.");
        }

        if (!user.isEmailVerified()) {
            recordAttempt(email, ipAddress, userAgent, false, "EMAIL_NOT_VERIFIED");
            throw new UnauthorizedException("Your college email is not verified. Please verify your email to continue.");
        }

        if (!user.isPhoneVerified()) {
            recordAttempt(email, ipAddress, userAgent, false, "PHONE_NOT_VERIFIED");
            throw new UnauthorizedException("Your phone number is not verified. Please verify your phone number to continue.");
        }
    }

    private boolean isLocked(User user) {
        return user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(Instant.now());
    }

    private void recordAttempt(String email, String ipAddress, String userAgent, boolean successful, String failureReason) {
        loginAttemptRepository.save(new LoginAttempt(email, ipAddress, userAgent, successful, failureReason));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
