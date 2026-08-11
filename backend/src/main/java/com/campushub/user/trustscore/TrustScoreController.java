package com.campushub.user.trustscore;

import com.campushub.common.api.ApiResponse;
import com.campushub.common.exception.UnauthorizedException;
import com.campushub.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TrustScoreController {
    private final TrustScoreService service;

    public TrustScoreController(TrustScoreService service) { this.service = service; }

    @GetMapping("/user/trust-score")
    public ApiResponse<TrustScoreResponse> own(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Campus Trust Score loaded successfully", service.getOwnScore(id(user)));
    }

    @GetMapping("/user/trust-score/history")
    public ApiResponse<TrustScoreHistoryResponse> history(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Campus Trust Score history loaded successfully", service.getHistory(id(user)));
    }

    @GetMapping("/users/{userId}/trust-score/public")
    public ApiResponse<TrustScoreResponse> publicScore(@PathVariable Long userId) {
        return ApiResponse.success("Public Campus Trust Score loaded successfully", service.getPublicScore(userId));
    }

    @GetMapping("/admin/users/{userId}/trust-score")
    public ApiResponse<TrustScoreResponse> adminScore(@PathVariable Long userId) {
        return ApiResponse.success("Admin Campus Trust Score loaded successfully", service.getAdminScore(userId));
    }

    @GetMapping("/admin/users/{userId}/trust-score/history")
    public ApiResponse<TrustScoreHistoryResponse> adminHistory(@PathVariable Long userId) {
        return ApiResponse.success("Admin Campus Trust Score history loaded successfully", service.getHistory(userId));
    }

    @PostMapping("/admin/users/{userId}/trust-score/recalculate")
    public ApiResponse<TrustScoreResponse> recalculate(
            @PathVariable Long userId,
            @AuthenticationPrincipal AuthenticatedUser admin) {
        TrustScore score = service.recalculateAndSave(userId, "ADMIN", admin == null ? null : admin.userId(),
                "Admin requested a deterministic recalculation", true);
        return ApiResponse.success("Campus Trust Score recalculated successfully", service.getAdminScore(score.getUser().getId()));
    }

    private Long id(AuthenticatedUser user) {
        if (user == null) throw new UnauthorizedException("Authentication is required.");
        return user.userId();
    }
}
