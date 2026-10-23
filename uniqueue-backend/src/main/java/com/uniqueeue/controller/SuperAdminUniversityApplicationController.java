package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.UniversityApplicationResponse;
import com.uniqueeue.model.PasswordResetToken;
import com.uniqueeue.model.UniversityApplication;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.PasswordResetTokenRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.EmailService;
import com.uniqueeue.service.UniversityApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/super-admin/university-applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Slf4j
public class SuperAdminUniversityApplicationController {

    private final UniversityApplicationService service;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UniversityApplicationResponse>>> list(
            @RequestParam(required = false) UniversityApplication.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success("Applications", service.list(status, page, size)));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<UniversityApplicationResponse>> approve(
            @PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Approved. Setup email sent.", service.approve(id, principal.getId())));
    }

    @PostMapping("/{id}/resend-setup-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendSetupEmail(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }

        User admin = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (admin == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Admin account not found for email: " + email));
        }

        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken prt = PasswordResetToken.builder()
                .token(token)
                .user(admin)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();
        passwordResetTokenRepository.save(prt);

        log.info("🔄 Resending setup email to {} (token: {}...)", admin.getEmail(), token.substring(0, 8));
        emailService.sendAdminSetupEmail(admin, token);

        return ResponseEntity.ok(ApiResponse.success(
                "Setup email resent",
                Map.of("email", admin.getEmail(), "message", "Check Render logs for 📧 messages")));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<UniversityApplicationResponse>> reject(
            @PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(ApiResponse.success("Rejected", service.reject(id, reason)));
    }
}