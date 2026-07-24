package com.campushub.profile;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.profile.dto.ChangePasswordRequest;
import com.campushub.profile.dto.PrivacySettingsRequest;
import com.campushub.profile.dto.ProfilePhotoResponse;
import com.campushub.profile.dto.ProfileSummaryResponse;
import com.campushub.profile.dto.ProfileUpdateRequest;
import com.campushub.profile.dto.PublicProfileResponse;
import com.campushub.profile.dto.StudentProfileResponse;
import com.campushub.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profile")
    public ApiResponse<StudentProfileResponse> getProfile(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Student profile loaded successfully",
                profileService.getProfile(userId(authenticatedUser))
        );
    }

    @PutMapping("/profile")
    public ApiResponse<StudentProfileResponse> updateProfile(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return ApiResponse.success(
                "Profile updated successfully.",
                profileService.updateProfile(userId(authenticatedUser), request)
        );
    }

    @PostMapping(
            path = "/profile/photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<ProfilePhotoResponse> updateProfilePhoto(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam("photo") MultipartFile photo
    ) {
        return ApiResponse.success(
                "Profile photo updated successfully.",
                profileService.updateProfilePhoto(userId(authenticatedUser), photo)
        );
    }

    @GetMapping("/profile/photo/content/{fileName}")
    public ResponseEntity<Resource> profilePhoto(@PathVariable String fileName) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .contentType(MediaType.parseMediaType(profileService.profilePhotoContentType(fileName)))
                .body(profileService.loadProfilePhoto(fileName));
    }

    @PutMapping("/privacy-settings")
    public ApiResponse<StudentProfileResponse> updatePrivacySettings(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestBody PrivacySettingsRequest request
    ) {
        return ApiResponse.success(
                "Privacy settings updated successfully.",
                profileService.updatePrivacy(userId(authenticatedUser), request)
        );
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        profileService.changePassword(userId(authenticatedUser), request);
        return ApiResponse.success(
                "Password changed successfully. Please sign in again.",
                null
        );
    }

    @PostMapping("/deactivate-request")
    public ApiResponse<String> requestDeactivation(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Account deactivation request submitted.",
                profileService.requestDeactivation(userId(authenticatedUser))
        );
    }

    @GetMapping("/public-profile/{userId}")
    public ApiResponse<PublicProfileResponse> getPublicProfile(@PathVariable Long userId) {
        return ApiResponse.success(
                "Public seller profile loaded successfully",
                profileService.getPublicProfile(userId)
        );
    }

    @GetMapping("/profile-summary")
    public ApiResponse<ProfileSummaryResponse> getProfileSummary(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(
                "Profile summary loaded successfully",
                profileService.getProfileSummary(userId(authenticatedUser))
        );
    }

    private Long userId(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return authenticatedUser.userId();
    }
}
