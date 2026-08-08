package com.campushub.auth.service;

import com.campushub.activity.model.ActivityType;
import com.campushub.activity.model.UserActivity;
import com.campushub.activity.repository.UserActivityRepository;
import com.campushub.auth.dto.AvailabilityResponse;
import com.campushub.auth.dto.OtpDevCodesResponse;
import com.campushub.auth.dto.OtpSendResponse;
import com.campushub.auth.dto.SignupStartRequest;
import com.campushub.auth.dto.SignupStartResponse;
import com.campushub.auth.dto.SignupChannelVerifyRequest;
import com.campushub.auth.dto.SignupChannelVerifyResponse;
import com.campushub.auth.dto.SignupCompleteRequest;
import com.campushub.auth.dto.SignupVerifyRequest;
import com.campushub.auth.dto.SignupVerifyResponse;
import com.campushub.auth.dto.UsernameAvailabilityResponse;
import com.campushub.auth.model.OtpChannel;
import com.campushub.college.model.College;
import com.campushub.college.service.CollegeService;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.notification.NotificationService;
import com.campushub.notification.model.NotificationPriority;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.model.RelatedEntityType;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.regex.Pattern;

@Service
public class SignupService {

    private static final int RESEND_AFTER_SECONDS = 60;
    private static final int INITIAL_TRUST_SCORE = 30;
    private static final Pattern USERNAME_PATTERN = Pattern.compile(
            "^[a-z0-9_](?!.*\\.\\.)[a-z0-9_.]{1,28}[a-z0-9_]$"
    );

    private final UserRepository userRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final CollegeService collegeService;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final UserActivityRepository activityRepository;
    private final boolean exposeDevOtpCodes;

    public SignupService(
            UserRepository userRepository,
            TrustScoreRepository trustScoreRepository,
            CollegeService collegeService,
            OtpService otpService,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService,
            UserActivityRepository activityRepository,
            @Value("${app.otp.expose-dev-codes}") boolean exposeDevOtpCodes
    ) {
        this.userRepository = userRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.collegeService = collegeService;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.activityRepository = activityRepository;
        this.exposeDevOtpCodes = exposeDevOtpCodes;
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse checkEmail(String email) {
        return new AvailabilityResponse(!userRepository.existsByEmailIgnoreCase(normalizeEmail(email)));
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse checkPhone(String phoneNumber) {
        return new AvailabilityResponse(!userRepository.existsByPhoneNumber(normalizePhone(phoneNumber)));
    }

    @Transactional(readOnly = true)
    public UsernameAvailabilityResponse checkUsername(String rawUsername) {
        String username = normalizeUsername(rawUsername);
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            return new UsernameAvailabilityResponse(
                    false,
                    "Use 3-30 lowercase letters, numbers, underscores, or single dots."
            );
        }
        boolean available = !userRepository.existsByUsernameIgnoreCase(username);
        return new UsernameAvailabilityResponse(
                available,
                available ? "Username is available." : "This username is already taken."
        );
    }

    @Transactional
    public SignupStartResponse startSignup(SignupStartRequest request) {
        College college = collegeService.getActiveCollege(request.collegeId());
        String username = normalizeUsername(request.username());
        String email = normalizeEmail(request.email());
        String phoneNumber = normalizePhone(request.phoneNumber());

        ensureValidUsername(username);
        ensureUniqueUsername(username);
        ensureUniqueEmail(email);
        ensureUniquePhone(phoneNumber);
        validateOtherValue(request.department(), request.customDepartment(), "Please enter your department / branch.");
        validateOtherValue(request.yearOfStudy(), request.customYearOfStudy(), "Please enter your year/status.");
        validateOtherValue(request.course(), request.customCourse(), "Please enter your course.");

        User user = new User(
                request.fullName().trim(),
                username,
                email,
                passwordEncoder.encode(request.password()),
                phoneNumber,
                college,
                request.department().trim(),
                trimToNull(request.customDepartment()),
                request.course().trim(),
                trimToNull(request.customCourse()),
                request.yearOfStudy().trim(),
                trimToNull(request.customYearOfStudy()),
                trimToNull(request.rollNumber()),
                normalizeOptionalToEmpty(request.hostelOrCampusArea()),
                trimToNull(request.profilePhotoFileName())
        );

        User savedUser = userRepository.save(user);

        return new SignupStartResponse(
                savedUser.getId(),
                savedUser.getStatus().name(),
                otpService.expirySeconds(),
                RESEND_AFTER_SECONDS,
                null
        );
    }

    @Transactional
    public OtpSendResponse resendOtp(Long userId, OtpChannel channel) {
        User user = getPendingUser(userId);
        if ((channel == OtpChannel.EMAIL && user.isEmailVerified())
                || (channel == OtpChannel.PHONE && user.isPhoneVerified())) {
            throw new BadRequestException("This contact method is already verified.");
        }
        String otp = otpService.createOtp(user, channel);
        return new OtpSendResponse(
                user.getId(),
                channel.name(),
                otpService.expirySeconds(),
                RESEND_AFTER_SECONDS,
                exposeDevOtpCodes ? otp : null
        );
    }

    @Transactional
    public SignupChannelVerifyResponse verifyChannel(SignupChannelVerifyRequest request, OtpChannel channel) {
        User user = getPendingUser(request.userId());
        if ((channel == OtpChannel.EMAIL && user.isEmailVerified())
                || (channel == OtpChannel.PHONE && user.isPhoneVerified())) {
            return new SignupChannelVerifyResponse(user.getId(), user.isEmailVerified(), user.isPhoneVerified());
        }
        otpService.verifyOtp(user.getId(), channel, request.otp());
        if (channel == OtpChannel.EMAIL) {
            user.markEmailVerified();
        } else {
            user.markPhoneVerified();
        }
        return new SignupChannelVerifyResponse(user.getId(), user.isEmailVerified(), user.isPhoneVerified());
    }

    @Transactional
    public SignupVerifyResponse completeSignup(SignupCompleteRequest request) {
        User user = getPendingUser(request.userId());
        if (!user.isEmailVerified() || !user.isPhoneVerified()) {
            throw new BadRequestException("Verify both your email and phone number before creating the account.");
        }
        return activateAccount(user);
    }

    @Transactional
    public SignupVerifyResponse verifySignup(SignupVerifyRequest request) {
        User user = getPendingUser(request.userId());
        otpService.verifyOtp(user.getId(), OtpChannel.EMAIL, request.emailOtp());
        user.markEmailVerified();
        otpService.verifyOtp(user.getId(), OtpChannel.PHONE, request.phoneOtp());
        user.markPhoneVerified();
        return activateAccount(user);
    }

    private SignupVerifyResponse activateAccount(User user) {
        user.activateAfterVerification();
        trustScoreRepository.save(new TrustScore(user, INITIAL_TRUST_SCORE, "College email and phone verified"));
        notificationService.notify(
                user,
                NotificationType.ACCOUNT,
                NotificationPriority.MEDIUM,
                "Account verified",
                "Your email and phone number are verified. Welcome to Campus Hub.",
                RelatedEntityType.PROFILE,
                user.getId(),
                "/student/profile"
        );
        notificationService.notify(
                user,
                NotificationType.SYSTEM,
                NotificationPriority.LOW,
                "Complete your profile",
                "Add a profile photo, bio, and professional link to improve your Campus Trust Score.",
                RelatedEntityType.PROFILE,
                user.getId(),
                "/student/profile"
        );
        activityRepository.save(new UserActivity(
                user,
                ActivityType.ACCOUNT_VERIFIED,
                "Completed college email and phone verification."
        ));
        return new SignupVerifyResponse(user.getId(), AccountStatus.ACTIVE.name(), INITIAL_TRUST_SCORE);
    }

    private User getPendingUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getStatus() != AccountStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("This account is not pending verification.");
        }
        return user;
    }

    private void ensureValidUsername(String username) {
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new BadRequestException("Please enter a valid username.");
        }
    }

    private void ensureUniqueUsername(String username) {
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResourceConflictException("This username is already taken.");
        }
    }

    private void ensureUniqueEmail(String email) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResourceConflictException("This email is already registered.");
        }
    }

    private void ensureUniquePhone(String phoneNumber) {
        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new ResourceConflictException("This phone number is already registered.");
        }
    }

    private void validateOtherValue(String value, String customValue, String message) {
        if ("Other".equalsIgnoreCase(value) && trimToNull(customValue) == null) {
            throw new BadRequestException(message);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    private String normalizePhone(String phoneNumber) {
        return phoneNumber == null ? "" : phoneNumber.replaceAll("\\s+", "");
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeOptionalToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
