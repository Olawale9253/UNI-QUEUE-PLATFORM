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
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * University-scoped user management. Mirrors the super-admin endpoints in
 * {@link SuperAdminUserController}, but:
 *
 *   • Every query is scoped to the caller's university — an admin can never
 *     see or modify a user from another tenant.
 *   • Admins can only assign USER / FRESHER / STAFF — never ADMIN or SUPER_ADMIN.
 *   • Admins can only edit accounts whose current role is USER / FRESHER / STAFF
 *     — they can't disable or demote other admins.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuditService auditService;

    /** Roles an admin can assign to a user. */
    private static final List<Role> ADMIN_ASSIGNABLE_ROLES =
            List.of(Role.USER, Role.FRESHER, Role.STAFF);

    /** Roles an admin can modify (change role / disable). */
    private static final List<Role> ADMIN_EDITABLE_ROLES =
            List.of(Role.USER, Role.FRESHER, Role.STAFF);

    // ═══════════════════════════════════════════════════════════
    //  LIST — only this admin's university
    // ═══════════════════════════════════════════════════════════

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long universityId = principal.getUniversityId();
        if (universityId == null) {
            throw new BadRequestException("Admin account is not linked to a university");
        }

        String term = (search == null || search.isBlank()) ? null : search.trim();

        Page<User> result = userRepository.searchGlobalUsers(
                universityId, role, isActive, term,
                PageRequest.of(page, Math.min(size, 100),
                        Sort.by(Sort.Direction.DESC, "createdAt")));

        Map<String, Object> payload = new HashMap<>();
        payload.put("content", result.getContent().stream()
                .map(GlobalUserResponse::from).toList());
        payload.put("page", result.getNumber());
        payload.put("size", result.getSize());
        payload.put("totalElements", result.getTotalElements());
        payload.put("totalPages", result.getTotalPages());

        return ResponseEntity.ok(ApiResponse.success("Users", payload));
    }

    // ═══════════════════════════════════════════════════════════
    //  GET ONE
    // ═══════════════════════════════════════════════════════════

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<GlobalUserResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = requireOwnUser(id, principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("User", GlobalUserResponse.from(user)));
    }

    // ═══════════════════════════════════════════════════════════
    //  CHANGE ROLE
    // ═══════════════════════════════════════════════════════════

    @PostMapping("/{id}/change-role")
    @Transactional
    public ResponseEntity<ApiResponse<GlobalUserResponse>> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = requireOwnUser(id, principal.getUniversityId());

        if (!ADMIN_EDITABLE_ROLES.contains(user.getRole())) {
            throw new BadRequestException(
                    "You cannot change the role of " + user.getRole() + " accounts.");
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
                    "Invalid role. Allowed: USER, FRESHER, STAFF");
        }

        if (!ADMIN_ASSIGNABLE_ROLES.contains(newRole)) {
            throw new BadRequestException(
                    "Admins cannot assign the " + newRole + " role.");
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

        auditService.record(principal.getId(), principal.getUniversityId(),
                AuditAction.USER_REGISTERED, "User", saved.getId(),
                "{\"action\":\"role-changed\",\"from\":\"" + oldRole
                        + "\",\"to\":\"" + newRole + "\",\"by\":\"ADMIN\"}");

        if (saved.getUniversity() != null) saved.getUniversity().getName();

        return ResponseEntity.ok(ApiResponse.success(
                "Role updated to " + newRole, GlobalUserResponse.from(saved)));
    }

    // ═══════════════════════════════════════════════════════════
    //  TOGGLE ACTIVE
    // ═══════════════════════════════════════════════════════════

    @PostMapping("/{id}/toggle-active")
    @Transactional
    public ResponseEntity<ApiResponse<GlobalUserResponse>> toggleActive(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = requireOwnUser(id, principal.getUniversityId());

        if (!ADMIN_EDITABLE_ROLES.contains(user.getRole())) {
            throw new BadRequestException(
                    "You cannot disable " + user.getRole() + " accounts.");
        }

        user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
        User saved = userRepository.save(user);

        auditService.record(principal.getId(), principal.getUniversityId(),
                AuditAction.USER_REGISTERED, "User", saved.getId(),
                "{\"action\":\"toggle-active\",\"isActive\":" + saved.getIsActive()
                        + ",\"by\":\"ADMIN\"}");

        if (saved.getUniversity() != null) saved.getUniversity().getName();

        return ResponseEntity.ok(ApiResponse.success(
                saved.getIsActive() ? "User enabled" : "User disabled",
                GlobalUserResponse.from(saved)));
    }

    // ═══════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════

    private User requireOwnUser(Long userId, Long universityId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (u.getUniversity() == null
                || !u.getUniversity().getId().equals(universityId)) {
            throw new ResourceNotFoundException("User not found");
        }
        return u;
    }
}