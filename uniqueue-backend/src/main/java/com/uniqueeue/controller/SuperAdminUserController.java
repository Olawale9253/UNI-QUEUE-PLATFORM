package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.GlobalUserResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminUserController {

    private final UserRepository userRepository;
    private final AuditService auditService;

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

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<GlobalUserResponse>> get(@PathVariable Long id) {
        User userValue = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Force-load university within the transaction
        if (userValue.getUniversity() != null) {
            userValue.getUniversity().getName();
        }
        return ResponseEntity.ok(ApiResponse.success("User", GlobalUserResponse.from(userValue)));
    }

    @PostMapping("/{id}/toggle-active")
    @Transactional
    public ResponseEntity<ApiResponse<GlobalUserResponse>> toggleActive(@PathVariable Long id) {
        User userValue2 = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (userValue2.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Cannot disable a super admin");
        }

        userValue2.setIsActive(!Boolean.TRUE.equals(userValue2.getIsActive()));
        User saved = userRepository.save(userValue2);

        auditService.record(null,
                userValue2.getUniversity() != null ? userValue2.getUniversity().getId() : null,
                AuditAction.USER_REGISTERED,
                "User", saved.getId(),
                "{\"action\":\"toggle-active\",\"isActive\":" + saved.getIsActive() + "}");

        // Force-load university before returning
        if (saved.getUniversity() != null) {
            saved.getUniversity().getName();
        }

        return ResponseEntity.ok(ApiResponse.success(
                saved.getIsActive() ? "User enabled" : "User disabled",
                GlobalUserResponse.from(saved)));
    }
}