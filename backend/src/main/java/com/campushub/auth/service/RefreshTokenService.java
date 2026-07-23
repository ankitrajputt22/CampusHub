package com.campushub.auth.service;

import com.campushub.auth.dto.AccessTokenResponse;
import com.campushub.auth.model.RefreshToken;
import com.campushub.auth.repository.RefreshTokenRepository;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long defaultRefreshTokenDays;
    private final long rememberMeRefreshTokenDays;
    private final JwtTokenService jwtTokenService;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            JwtTokenService jwtTokenService,
            @Value("${app.security.refresh-token-days}") long defaultRefreshTokenDays,
            @Value("${app.security.remember-me-refresh-token-days}") long rememberMeRefreshTokenDays
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenService = jwtTokenService;
        this.defaultRefreshTokenDays = defaultRefreshTokenDays;
        this.rememberMeRefreshTokenDays = rememberMeRefreshTokenDays;
    }

    @Transactional
    public String createRefreshToken(User user, boolean rememberMe) {
        byte[] tokenBytes = new byte[48];
        secureRandom.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        long durationDays = rememberMe ? rememberMeRefreshTokenDays : defaultRefreshTokenDays;

        refreshTokenRepository.save(new RefreshToken(
                user,
                sha256(rawToken),
                Instant.now().plusSeconds(durationDays * 24 * 60 * 60)
        ));

        return rawToken;
    }

    @Transactional(readOnly = true)
    public AccessTokenResponse refreshAccessToken(String rawToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid or expired."));
        User user = refreshToken.getUser();

        if (refreshToken.isRevoked() || !refreshToken.getExpiresAt().isAfter(Instant.now())) {
            throw new UnauthorizedException("Refresh token is invalid or expired.");
        }
        if (user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()
                || !user.isPhoneVerified()) {
            throw new UnauthorizedException("This account cannot start a new session.");
        }

        return new AccessTokenResponse(jwtTokenService.createAccessToken(user));
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(sha256(rawToken))
                .ifPresent(RefreshToken::revoke);
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
