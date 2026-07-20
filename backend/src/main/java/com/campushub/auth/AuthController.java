package com.campushub.auth;

import com.campushub.auth.dto.AvailabilityRequest;
import com.campushub.auth.dto.AvailabilityResponse;
import com.campushub.auth.dto.LoginRequest;
import com.campushub.auth.dto.LoginResponse;
import com.campushub.auth.dto.OtpResendRequest;
import com.campushub.auth.dto.OtpSendResponse;
import com.campushub.auth.dto.SignupStartRequest;
import com.campushub.auth.dto.SignupStartResponse;
import com.campushub.auth.dto.SignupVerifyRequest;
import com.campushub.auth.dto.SignupVerifyResponse;
import com.campushub.auth.model.OtpChannel;
import com.campushub.auth.service.LoginService;
import com.campushub.auth.service.SignupService;
import com.campushub.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SignupService signupService;
    private final LoginService loginService;

    public AuthController(SignupService signupService, LoginService loginService) {
        this.signupService = signupService;
        this.loginService = loginService;
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
}
