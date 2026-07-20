package com.campushub.auth.service;

import com.campushub.auth.model.RefreshToken;
import com.campushub.auth.repository.RefreshTokenRepository;
import com.campushub.user.model.User;
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

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.security.refresh-token-days}") long defaultRefreshTokenDays,
            @Value("${app.security.remember-me-refresh-token-days}") long rememberMeRefreshTokenDays
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
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

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }
}
