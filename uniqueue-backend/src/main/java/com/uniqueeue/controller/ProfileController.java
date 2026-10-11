package com.uniqueeue.controller;

import com.uniqueeue.dto.request.ChangePasswordRequest;
import com.uniqueeue.dto.request.EmailChangeRequest;
import com.uniqueeue.dto.request.EmailChangeVerifyRequest;
import com.uniqueeue.dto.request.UpdateProfileRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.AuthResponse;
import com.uniqueeue.dto.response.ProfileResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.EmailChangeService;
import com.uniqueeue.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final EmailChangeService emailChangeService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> me(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Profile", profileService.getProfile(principal.getId())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> update(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Profile updated",
                profileService.updateProfile(principal.getId(), request)));
    }

    /**
     * Change password. Backend bumps tokenVersion (invalidating every existing
     * session) and returns a fresh access + refresh token so the caller's
     * current tab stays logged in while all other sessions are killed.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<AuthResponse>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AuthResponse response = profileService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed", response));
    }

    // ───────────────────────────────────────────────────────────
    //  EMAIL CHANGE (2-step + resend)
    // ───────────────────────────────────────────────────────────

    @PostMapping("/email/request")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestEmailChange(
            @Valid @RequestBody EmailChangeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String devCode = emailChangeService.requestChange(principal.getId(), request);

        Map<String, Object> data = new HashMap<>();
        data.put("email", request.getNewEmail().toLowerCase().trim());
        data.put("expiresInMinutes", 15);
        if (devCode != null) data.put("devCode", devCode);

        return ResponseEntity.ok(ApiResponse.success("Verification code sent", data));
    }

    /**
     * Resend the verification code to the pending email without requiring
     * the password again — as long as the pending request hasn't expired.
     * Rate-limited server-side (30s cooldown).
     */
    @PostMapping("/email/resend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendEmailChangeCode(
            @AuthenticationPrincipal UserPrincipal principal) {
        EmailChangeService.ResendResult result =
                emailChangeService.resendPending(principal.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("email", result.pendingEmail());
        data.put("expiresInMinutes", result.expiresInMinutes());
        if (result.devCode() != null) data.put("devCode", result.devCode());

        return ResponseEntity.ok(ApiResponse.success("Code resent", data));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<ApiResponse<ProfileResponse>> verifyEmailChange(
            @Valid @RequestBody EmailChangeVerifyRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        emailChangeService.verifyChange(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(
                "Email updated",
                profileService.getProfile(principal.getId())));
    }
}