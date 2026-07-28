package com.campushub.auth;

import com.campushub.auth.dto.AvailabilityRequest;
import com.campushub.auth.dto.AvailabilityResponse;
import com.campushub.auth.dto.AccessTokenResponse;
import com.campushub.auth.dto.LoginRequest;
import com.campushub.auth.dto.LoginResponse;
import com.campushub.auth.dto.OtpResendRequest;
import com.campushub.auth.dto.OtpSendResponse;
import com.campushub.auth.dto.PasswordResetCompleteRequest;
import com.campushub.auth.dto.PasswordResetStartRequest;
import com.campushub.auth.dto.PasswordResetStartResponse;
import com.campushub.auth.dto.PasswordResetVerifyRequest;
import com.campushub.auth.dto.PasswordResetVerifyResponse;
import com.campushub.auth.dto.RefreshTokenRequest;
import com.campushub.auth.dto.SignupStartRequest;
import com.campushub.auth.dto.SignupStartResponse;
import com.campushub.auth.dto.SignupVerifyRequest;
import com.campushub.auth.dto.SignupVerifyResponse;
import com.campushub.auth.model.OtpChannel;
import com.campushub.auth.service.LoginService;
import com.campushub.auth.service.PasswordResetService;
import com.campushub.auth.service.RefreshTokenService;
import com.campushub.auth.service.SignupService;
import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SignupService signupService;
    private final LoginService loginService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetService passwordResetService;

    public AuthController(
            SignupService signupService,
            LoginService loginService,
            RefreshTokenService refreshTokenService,
            PasswordResetService passwordResetService
    ) {
        this.signupService = signupService;
        this.loginService = loginService;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/check-email")
    public ApiResponse<AvailabilityResponse> checkEmail(@Valid @RequestBody AvailabilityRequest request) {
        return ApiResponse.success("Email availability checked", signupService.checkEmail(request.value()));
    }

    @PostMapping("/check-phone")
    public ApiResponse<AvailabilityResponse> checkPhone(@Valid @RequestBody AvailabilityRequest request) {
        return ApiResponse.success("Phone availability checked", signupService.checkPhone(request.value()));
    }

    @PostMapping("/signup/start")
    public ApiResponse<SignupStartResponse> startSignup(@Valid @RequestBody SignupStartRequest request) {
        return ApiResponse.success("Verification OTPs sent", signupService.startSignup(request));
    }

    @PostMapping("/send-email-otp")
    public ApiResponse<OtpSendResponse> sendEmailOtp(@Valid @RequestBody OtpResendRequest request) {
        return ApiResponse.success("Email OTP sent", signupService.resendOtp(request.userId(), OtpChannel.EMAIL));
    }

    @PostMapping("/send-phone-otp")
    public ApiResponse<OtpSendResponse> sendPhoneOtp(@Valid @RequestBody OtpResendRequest request) {
        return ApiResponse.success("Phone OTP sent", signupService.resendOtp(request.userId(), OtpChannel.PHONE));
    }

    @PostMapping("/verify-signup-otp")
    public ApiResponse<SignupVerifyResponse> verifySignupOtp(@Valid @RequestBody SignupVerifyRequest request) {
        return ApiResponse.success("Account created successfully. Welcome to Campus Hub!",
                signupService.verifySignup(request));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        return ApiResponse.success("Login successful", loginService.login(request, ipAddress, userAgent));
    }

    @PostMapping("/refresh")
    public ApiResponse<AccessTokenResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        return ApiResponse.success(
                "Access token refreshed",
                refreshTokenService.refreshAccessToken(request.refreshToken())
        );
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        refreshTokenService.revoke(request.refreshToken());
        return ApiResponse.success("Logout successful", null);
    }

    @PostMapping("/logout-all-devices")
    public ApiResponse<Void> logoutAllDevices(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        refreshTokenService.revokeAllForUser(authenticatedUser.userId());
        return ApiResponse.success("Logged out from all devices successfully.", null);
    }

    @PostMapping("/password-reset/request")
    public ApiResponse<PasswordResetStartResponse> requestPasswordReset(
            @Valid @RequestBody PasswordResetStartRequest request
    ) {
        return ApiResponse.success(
                "If an active verified account exists, a recovery code has been issued.",
                passwordResetService.start(request)
        );
    }

    @PostMapping("/password-reset/verify")
    public ApiResponse<PasswordResetVerifyResponse> verifyPasswordReset(
            @Valid @RequestBody PasswordResetVerifyRequest request
    ) {
        return ApiResponse.success(
                "Recovery code verified",
                passwordResetService.verify(request)
        );
    }

    @PostMapping("/password-reset/complete")
    public ApiResponse<Void> completePasswordReset(
            @Valid @RequestBody PasswordResetCompleteRequest request
    ) {
        passwordResetService.complete(request);
        return ApiResponse.success(
                "Password reset successfully. Please sign in with your new password.",
                null
        );
    }
}
