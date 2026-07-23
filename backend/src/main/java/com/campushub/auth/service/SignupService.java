package com.campushub.auth.service;

import com.campushub.activity.model.ActivityType;
import com.campushub.activity.model.UserActivity;
import com.campushub.activity.repository.UserActivityRepository;
import com.campushub.auth.dto.AvailabilityResponse;
import com.campushub.auth.dto.OtpDevCodesResponse;
import com.campushub.auth.dto.OtpSendResponse;
import com.campushub.auth.dto.SignupStartRequest;
import com.campushub.auth.dto.SignupStartResponse;
import com.campushub.auth.dto.SignupVerifyRequest;
import com.campushub.auth.dto.SignupVerifyResponse;
import com.campushub.auth.model.OtpChannel;
import com.campushub.college.model.College;
import com.campushub.college.service.CollegeService;
import com.campushub.common.exception.BadRequestException;
import com.campushub.common.exception.ResourceConflictException;
import com.campushub.common.exception.ResourceNotFoundException;
import com.campushub.notification.model.Notification;
import com.campushub.notification.model.NotificationType;
import com.campushub.notification.repository.NotificationRepository;
import com.campushub.user.model.AccountStatus;
import com.campushub.user.model.User;
import com.campushub.user.repository.UserRepository;
import com.campushub.user.trustscore.TrustScore;
import com.campushub.user.trustscore.TrustScoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SignupService {

    private static final int RESEND_AFTER_SECONDS = 60;
    private static final int INITIAL_TRUST_SCORE = 30;

    private final UserRepository userRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final CollegeService collegeService;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository activityRepository;
    private final boolean exposeDevOtpCodes;

    public SignupService(
            UserRepository userRepository,
            TrustScoreRepository trustScoreRepository,
            CollegeService collegeService,
            OtpService otpService,
            PasswordEncoder passwordEncoder,
            NotificationRepository notificationRepository,
            UserActivityRepository activityRepository,
            @Value("${app.otp.expose-dev-codes}") boolean exposeDevOtpCodes
    ) {
        this.userRepository = userRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.collegeService = collegeService;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.notificationRepository = notificationRepository;
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

    @Transactional
    public SignupStartResponse startSignup(SignupStartRequest request) {
        College college = collegeService.getActiveCollege(request.collegeId());
        String email = normalizeEmail(request.collegeEmail());
        String phoneNumber = normalizePhone(request.phoneNumber());

        validateEmailDomain(email, college);
        ensureUniqueEmail(email);
        ensureUniquePhone(phoneNumber);
        validateOtherValue(request.department(), request.customDepartment(), "Please enter your department / branch.");
        validateOtherValue(request.yearOfStudy(), request.customYearOfStudy(), "Please enter your year/status.");
        validateOtherValue(request.course(), request.customCourse(), "Please enter your course.");

        User user = new User(
                request.fullName().trim(),
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
                request.hostelOrCampusArea().trim(),
                trimToNull(request.profilePhotoFileName())
        );

        User savedUser = userRepository.save(user);
        String emailOtp = otpService.createOtp(savedUser, OtpChannel.EMAIL);
        String phoneOtp = otpService.createOtp(savedUser, OtpChannel.PHONE);

        return new SignupStartResponse(
                savedUser.getId(),
                savedUser.getStatus().name(),
                otpService.expirySeconds(),
                RESEND_AFTER_SECONDS,
                exposeDevOtpCodes ? new OtpDevCodesResponse(emailOtp, phoneOtp) : null
        );
    }

    @Transactional
    public OtpSendResponse resendOtp(Long userId, OtpChannel channel) {
        User user = getPendingUser(userId);
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
    public SignupVerifyResponse verifySignup(SignupVerifyRequest request) {
        User user = getPendingUser(request.userId());
        otpService.verifyOtp(user.getId(), OtpChannel.EMAIL, request.emailOtp());
        otpService.verifyOtp(user.getId(), OtpChannel.PHONE, request.phoneOtp());
        user.activate();
        trustScoreRepository.save(new TrustScore(user, INITIAL_TRUST_SCORE, "College email and phone verified"));
        notificationRepository.save(new Notification(
                user,
                NotificationType.ACCOUNT,
                "Account verified",
                "Your college email and phone number are verified. Welcome to Campus Hub."
        ));
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

    private void validateEmailDomain(String email, College college) {
        String expectedDomain = "@" + college.getEmailDomain().toLowerCase();
        if (!email.endsWith(expectedDomain)) {
            throw new BadRequestException("You selected " + college.getName()
                    + ". Please use an email ending with " + expectedDomain + ".");
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

    private String normalizePhone(String phoneNumber) {
        return phoneNumber == null ? "" : phoneNumber.replaceAll("\\s+", "");
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
