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
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AuthService;
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

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Check your email for a verification code.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse response = authService.verifyEmail(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", response));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        String code = authService.resendVerification(request.getEmail());
        Map<String, Object> data = new HashMap<>();
        data.put("message", "A new verification code has been sent to your email.");
        if (code != null) {
            data.put("devVerificationCode", code);
        }
        return ResponseEntity.ok(ApiResponse.success("Verification code resent", data));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String token = authService.requestPasswordReset(request.getEmail());

        Map<String, Object> data = new HashMap<>();
        data.put("message",
                "If an account exists with that email, a reset link has been sent.");
        if (token != null) {
            data.put("resetToken", token);
            data.put("resetUrl", "/reset-password?token=" + token);
        }
        return ResponseEntity.ok(ApiResponse.success("Reset requested", data));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(
                "Password reset successful. You can now sign in.", null));
    }

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

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> universities() {
        List<Map<String, Object>> list = universityRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("name", u.getName());
                    m.put("code", u.getCode());
                    m.put("emailDomain", u.getEmailDomain());
                    m.put("matricExample", u.getMatricExample());
                    m.put("matricDescription", u.getMatricDescription());

                    // ─── Fresher config ───
                    m.put("fresherRegistrationEnabled", u.getFresherRegistrationEnabled());
                    m.put("fresherVerificationMode", u.getFresherVerificationMode());

                    m.put("requireJambReg", u.getRequireJambReg());
                    m.put("jambRegExample", u.getJambRegExample());
                    m.put("jambRegDescription", u.getJambRegDescription());

                    m.put("requireAdmissionRef", u.getRequireAdmissionRef());
                    m.put("admissionRefExample", u.getAdmissionRefExample());
                    m.put("admissionRefDescription", u.getAdmissionRefDescription());

                    m.put("requireApplicationNumber", u.getRequireApplicationNumber());
                    m.put("applicationNumberExample", u.getApplicationNumberExample());
                    m.put("applicationNumberDescription", u.getApplicationNumberDescription());

                    return m;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Universities", list));
    }

    /**
     * Public, unauthenticated lookup used by the login page to brand itself
     * from the visitor's email domain.
     *
     * Example: /api/auth/universities/lookup?domain=unilag.edu.ng
     */
    @GetMapping("/universities/lookup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> lookupUniversity(
            @RequestParam(value = "domain", required = false) String domain) {

        if (domain == null || domain.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success("No domain provided", null));
        }

        String normalized = domain.trim().toLowerCase();
        if (normalized.startsWith("@")) normalized = normalized.substring(1);
        final String lookupDomain = normalized;

        var uni = universityRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> {
                    String d = u.getEmailDomain();
                    if (d == null) return false;
                    d = d.toLowerCase();
                    if (d.startsWith("@")) d = d.substring(1);
                    return d.equals(lookupDomain);
                })
                .findFirst()
                .orElse(null);

        if (uni == null) {
            return ResponseEntity.ok(ApiResponse.success("Not found", null));
        }

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