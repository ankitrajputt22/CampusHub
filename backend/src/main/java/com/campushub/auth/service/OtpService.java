package com.campushub.auth.service;

import com.campushub.auth.model.OtpChannel;
import com.campushub.auth.model.OtpVerification;
import com.campushub.auth.repository.OtpVerificationRepository;
import com.campushub.common.exception.BadRequestException;
import com.campushub.user.model.User;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {

    private static final int MAX_ATTEMPTS = 5;

    private final OtpVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Duration expiry;

    public OtpService(
            OtpVerificationRepository otpVerificationRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.otp.expiry-minutes}") long expiryMinutes
    ) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.expiry = Duration.ofMinutes(expiryMinutes);
    }

    @Transactional
    public String createOtp(User user, OtpChannel channel) {
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        String destination = channel == OtpChannel.EMAIL ? user.getEmail() : user.getPhoneNumber();
        OtpVerification verification = new OtpVerification(
                user,
                channel,
                passwordEncoder.encode(otp),
                destination,
                Instant.now().plus(expiry)
        );
        otpVerificationRepository.save(verification);
        return otp;
    }

    @Transactional
    public void verifyOtp(Long userId, OtpChannel channel, String otp) {
        OtpVerification verification = otpVerificationRepository
                .findTopByUserIdAndChannelAndUsedAtIsNullOrderByCreatedAtDesc(userId, channel)
                .orElseThrow(() -> new BadRequestException("Please request a new OTP."));

        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            throw new BadRequestException("Maximum OTP attempts exceeded. Please request a new OTP.");
        }

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(channel == OtpChannel.EMAIL
                    ? "Email OTP has expired."
                    : "Phone OTP has expired.");
        }

        if (!passwordEncoder.matches(otp, verification.getOtpHash())) {
            verification.incrementAttempts();
            throw new BadRequestException(channel == OtpChannel.EMAIL
                    ? "Invalid email OTP."
                    : "Invalid phone OTP.");
        }

        verification.markUsed();
    }

    public int expirySeconds() {
        return (int) expiry.toSeconds();
    }
}
