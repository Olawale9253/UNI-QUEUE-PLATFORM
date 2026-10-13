package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.GlobalUserResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminUserController {

    private final UserRepository userRepository;
    private final AuditService auditService;

    // ─────────────────────────────────────────────────────────────
    //  LIST
    // ─────────────────────────────────────────────────────────────

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) Long universityId,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100));
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();

        Page<User> result = userRepository.searchGlobalUsers(
                universityId, role, isActive, searchTerm, pageable);

        Map<String, Object> payload = new HashMap<>();
        payload.put("content", result.getContent().stream()
                .map(GlobalUserResponse::from).toList());
        payload.put("page", result.getNumber());
        payload.put("size", result.getSize());
        payload.put("totalElements", result.getTotalElements());
        payload.put("totalPages", result.getTotalPages());

        return ResponseEntity.ok(ApiResponse.success("Users", payload));
    }

    // ─────────────────────────────────────────────────────────────
    //  GET ONE
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<GlobalUserResponse>> get(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getUniversity() != null) user.getUniversity().getName();
        return ResponseEntity.ok(ApiResponse.success("User", GlobalUserResponse.from(user)));
    }

    // ─────────────────────────────────────────────────────────────
    //  TOGGLE ACTIVE
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/{id}/toggle-active")
    @Transactional
    public ResponseEntity<ApiResponse<GlobalUserResponse>> toggleActive(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Cannot disable a super admin");
        }

        user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
        User saved = userRepository.save(user);

        auditService.record(null,
                user.getUniversity() != null ? user.getUniversity().getId() : null,
                AuditAction.USER_REGISTERED,
                "User", saved.getId(),
                "{\"action\":\"toggle-active\",\"isActive\":" + saved.getIsActive() + "}");

        if (saved.getUniversity() != null) saved.getUniversity().getName();

        return ResponseEntity.ok(ApiResponse.success(
                saved.getIsActive() ? "User enabled" : "User disabled",
                GlobalUserResponse.from(saved)));
    }

    // ─────────────────────────────────────────────────────────────
    //  CHANGE ROLE  ⬅ NEW
    //
    //  Super admin promotes a fresher to a returning student (or moves
    //  them to staff/admin). Bumps tokenVersion so the user must sign
    //  in again for the new role to take effect.
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/{id}/change-role")
    @Transactional
    public ResponseEntity<ApiResponse<GlobalUserResponse>> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Cannot change a super admin's role");
        }

        String rawRole = body.get("role");
        if (rawRole == null || rawRole.isBlank()) {
            throw new BadRequestException("Missing 'role' in request body");
        }

        Role newRole;
        try {
            newRole = Role.valueOf(rawRole.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid role. Allowed: USER, FRESHER, STAFF, ADMIN");
        }

        if (newRole == Role.SUPER_ADMIN) {
            throw new BadRequestException("Cannot promote a user to super admin");
        }

        Role oldRole = user.getRole();
        if (oldRole == newRole) {
            return ResponseEntity.ok(ApiResponse.success(
                    "Role unchanged", GlobalUserResponse.from(user)));
        }

        user.setRole(newRole);

        // FRESHER → USER is the "upgrade". Stamp the moment.
        if (oldRole == Role.FRESHER && newRole == Role.USER
                && user.getUpgradedToUserAt() == null) {
            user.setUpgradedToUserAt(LocalDateTime.now());
        }

        // Force re-login so the JWT carries the new role.
        user.setTokenVersion(
                (user.getTokenVersion() != null ? user.getTokenVersion() : 0) + 1);

        User saved = userRepository.save(user);

        auditService.record(principal != null ? principal.getId() : null,
                saved.getUniversity() != null ? saved.getUniversity().getId() : null,
                AuditAction.USER_REGISTERED,
                "User", saved.getId(),
                "{\"action\":\"role-changed\",\"from\":\"" + oldRole
                        + "\",\"to\":\"" + newRole + "\"}");

        if (saved.getUniversity() != null) saved.getUniversity().getName();

        return ResponseEntity.ok(ApiResponse.success(
                "Role updated to " + newRole,
                GlobalUserResponse.from(saved)));
    }
}