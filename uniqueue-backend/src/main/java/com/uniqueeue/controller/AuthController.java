package com.uniqueeue.controller;

import com.uniqueeue.dto.request.ForgotPasswordRequest;
import com.uniqueeue.dto.request.LoginRequest;
import com.uniqueeue.dto.request.RegisterRequest;
import com.uniqueeue.dto.request.ResendVerificationRequest;
import com.uniqueeue.dto.request.ResetPasswordRequest;
import com.uniqueeue.dto.request.VerifyEmailRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.AuthResponse;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AuthService;
import com.uniqueeue.ratelimit.RateLimited;
import com.uniqueeue.ratelimit.RateKeyType;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────
    //  REGISTER
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/register")
    @RateLimited(limit = 3, windowSeconds = 3600, keyType = RateKeyType.IP, name = "register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Check your email for a verification code.", response));
    }

    // ─────────────────────────────────────────────────────────────
    //  LOGIN
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/login")
    @RateLimited(limit = 5, windowSeconds = 900, keyType = RateKeyType.EMAIL, keyField = "email", name = "login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    // ─────────────────────────────────────────────────────────────
    //  VERIFY EMAIL
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/verify-email")
    @RateLimited(limit = 5, windowSeconds = 900, keyType = RateKeyType.EMAIL, keyField = "email", name = "verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse response = authService.verifyEmail(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", response));
    }

    // ─────────────────────────────────────────────────────────────
    //  RESEND VERIFICATION
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/resend-verification")
    @RateLimited(limit = 3, windowSeconds = 3600, keyType = RateKeyType.EMAIL, keyField = "email", name = "resend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        String code = authService.resendVerification(request.getEmail());
        Map<String, Object> data = new HashMap<>();
        data.put("message", "A new verification code has been sent to your email.");
        if (code != null) data.put("devVerificationCode", code);
        return ResponseEntity.ok(ApiResponse.success("Verification code resent", data));
    }

    // ─────────────────────────────────────────────────────────────
    //  FORGOT PASSWORD
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/forgot-password")
    @RateLimited(limit = 3, windowSeconds = 3600, keyType = RateKeyType.EMAIL, keyField = "email", name = "forgot")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String token = authService.requestPasswordReset(request.getEmail());
        Map<String, Object> data = new HashMap<>();
        data.put("message", "If an account exists with that email, a reset link has been sent.");
        if (token != null) {
            data.put("resetToken", token);
            data.put("resetUrl", "/reset-password?token=" + token);
        }
        return ResponseEntity.ok(ApiResponse.success("Reset requested", data));
    }

    // ─────────────────────────────────────────────────────────────
    //  RESET PASSWORD
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successful. You can now sign in.", null));
    }

    // ─────────────────────────────────────────────────────────────
    //  SETUP ACCOUNT (New Admin Invitation)
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/setup-account")
    public ResponseEntity<ApiResponse<Object>> setupAccount(@Valid @RequestBody ResetPasswordRequest request) {
        authService.setupAccount(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Account setup complete. You can now sign in.", null));
    }

    // ─────────────────────────────────────────────────────────────
    //  CURRENT USER
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", principal.getId());
        data.put("email", principal.getEmail());
        data.put("fullName", principal.getFullName());
        data.put("role", principal.getRole());
        data.put("universityId", principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Current user", data));
    }

    // ─────────────────────────────────────────────────────────────
    //  MY VERIFICATION STATUS
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/me/verification-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> myVerificationStatus(@AuthenticationPrincipal UserPrincipal principal) {
        var userOpt = userRepository.findById(principal.getId());
        if (userOpt.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("status", "VERIFIED");
            empty.put("reason", null);
            return ResponseEntity.ok(ApiResponse.success("Not found", empty));
        }
        var user = userOpt.get();
        Map<String, Object> data = new HashMap<>();
        data.put("status", user.getRegistrationStatus() != null ? user.getRegistrationStatus().name() : "VERIFIED");
        data.put("reason", user.getRejectionReason());
        data.put("verifiedAt", user.getVerifiedAt() != null ? user.getVerifiedAt().toString() : null);
        return ResponseEntity.ok(ApiResponse.success("Verification status", data));
    }

    // ─────────────────────────────────────────────────────────────
    //  UNIVERSITIES
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> universities() {
        List<Map<String, Object>> list = universityRepository.findAll().stream()
                .filter(university -> Boolean.TRUE.equals(university.getIsActive()))
                .map(university -> {
                    Map<String, Object> u = new HashMap<>();
                    u.put("id", university.getId());
                    u.put("name", university.getName());
                    u.put("code", university.getCode());
                    u.put("emailDomain", university.getEmailDomain());
                    u.put("matricExample", university.getMatricExample());
                    u.put("matricDescription", university.getMatricDescription());
                    u.put("fresherRegistrationEnabled", university.getFresherRegistrationEnabled());
                    u.put("fresherVerificationMode", university.getFresherVerificationMode());
                    u.put("requireJambReg", university.getRequireJambReg());
                    u.put("jambRegExample", university.getJambRegExample());
                    u.put("jambRegDescription", university.getJambRegDescription());
                    u.put("requireAdmissionRef", university.getRequireAdmissionRef());
                    u.put("admissionRefExample", university.getAdmissionRefExample());
                    u.put("admissionRefDescription", university.getAdmissionRefDescription());
                    u.put("requireApplicationNumber", university.getRequireApplicationNumber());
                    u.put("applicationNumberExample", university.getApplicationNumberExample());
                    u.put("applicationNumberDescription", university.getApplicationNumberDescription());
                    return u;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Universities", list));
    }

    // ─────────────────────────────────────────────────────────────
    //  REFRESH
    // ─────────────────────────────────────────────────────────────
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Missing refresh token"));
        }
        AuthResponse response = authService.refresh(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Session refreshed", response));
    }

    @PostMapping("/sign-out-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signOutAll(@AuthenticationPrincipal UserPrincipal principal) {
        authService.signOutAllDevices(principal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("signedOut", true);
        return ResponseEntity.ok(ApiResponse.success("Signed out on all devices. Please sign in again.", data));
    }

    // ─────────────────────────────────────────────────────────────
    //  UNIVERSITY LOOKUP BY EMAIL DOMAIN
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/universities/lookup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> lookupUniversity(@RequestParam(value = "domain", required = false) String domain) {
        if (domain == null || domain.isBlank()) return ResponseEntity.ok(ApiResponse.success("No domain provided", null));

        String normalized = domain.trim().toLowerCase();
        if (normalized.startsWith("@")) normalized = normalized.substring(1);
        final String lookupDomain = normalized;

        var uni = universityRepository.findAll().stream()
                .filter(university -> Boolean.TRUE.equals(university.getIsActive()))
                .filter(university -> {
                    String emailDomain = university.getEmailDomain();
                    if (emailDomain == null) return false;
                    emailDomain = emailDomain.toLowerCase();
                    if (emailDomain.startsWith("@")) emailDomain = emailDomain.substring(1);
                    return emailDomain.equals(lookupDomain);
                })
                .findFirst()
                .orElse(null);

        if (uni == null) return ResponseEntity.ok(ApiResponse.success("Not found", null));

        Map<String, Object> data = new HashMap<>();
        data.put("id", uni.getId());
        data.put("name", uni.getName());
        data.put("code", uni.getCode());
        data.put("logoUrl", uni.getLogoUrl());
        data.put("campusImageUrl", uni.getCampusImageUrl());
        data.put("tagline", uni.getTagline());
        data.put("primaryColor", uni.getPrimaryColor());
        return ResponseEntity.ok(ApiResponse.success("University", data));
    }
}