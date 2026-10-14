package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.PendingVerificationResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.RegistrationStatus;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/verification")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminVerificationController {

    private final UserRepository userRepository;
    private final AuditService auditService;

    // ═══════════════════════════════════════════════════════════
    //  PENDING QUEUE
    // ═══════════════════════════════════════════════════════════

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Map<String, Object>>> listPending(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        String term = (search == null || search.isBlank()) ? null : search.trim();

        Page<User> result = userRepository.searchPendingVerifications(
                principal.getUniversityId(),
                RegistrationStatus.PENDING,
                term,
                PageRequest.of(page, Math.min(size, 100),
                        Sort.by(Sort.Direction.ASC, "createdAt")));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("content", result.getContent().stream()
                .map(PendingVerificationResponse::from).toList());
        payload.put("page", result.getNumber());
        payload.put("size", result.getSize());
        payload.put("totalElements", result.getTotalElements());
        payload.put("totalPages", result.getTotalPages());

        return ResponseEntity.ok(ApiResponse.success("Pending verifications", payload));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long uniId = principal.getUniversityId();
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("pending",  userRepository.countByUniversityIdAndRegistrationStatus(uniId, RegistrationStatus.PENDING));
        stats.put("verified", userRepository.countByUniversityIdAndRegistrationStatus(uniId, RegistrationStatus.VERIFIED));
        stats.put("rejected", userRepository.countByUniversityIdAndRegistrationStatus(uniId, RegistrationStatus.REJECTED));
        return ResponseEntity.ok(ApiResponse.success("Verification stats", stats));
    }

    @PostMapping("/{userId}/approve")
    @Transactional
    public ResponseEntity<ApiResponse<Object>> approve(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = requireOwnUser(userId, principal.getUniversityId());
        user.setRegistrationStatus(RegistrationStatus.VERIFIED);
        user.setVerifiedAt(LocalDateTime.now());
        user.setVerifiedByUserId(principal.getId());
        user.setRejectionReason(null);
        userRepository.save(user);

        auditService.record(principal.getId(), principal.getUniversityId(),
                AuditAction.USER_REGISTERED, "User", user.getId(),
                "{\"action\":\"verification-approved\"}");

        return ResponseEntity.ok(ApiResponse.success("User approved", null));
    }

    @PostMapping("/{userId}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<Object>> reject(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = requireOwnUser(userId, principal.getUniversityId());
        String reason = body != null ? body.get("reason") : null;

        user.setRegistrationStatus(RegistrationStatus.REJECTED);
        user.setRejectionReason(reason);
        user.setVerifiedAt(LocalDateTime.now());
        user.setVerifiedByUserId(principal.getId());
        userRepository.save(user);

        auditService.record(principal.getId(), principal.getUniversityId(),
                AuditAction.USER_REGISTERED, "User", user.getId(),
                "{\"action\":\"verification-rejected\"}");

        return ResponseEntity.ok(ApiResponse.success("User rejected", null));
    }

    private User requireOwnUser(Long userId, Long universityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getUniversity() == null || !user.getUniversity().getId().equals(universityId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }
}