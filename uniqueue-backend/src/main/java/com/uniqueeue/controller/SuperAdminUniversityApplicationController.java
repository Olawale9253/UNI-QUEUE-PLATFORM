package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.UniversityApplicationResponse;
import com.uniqueeue.model.UniversityApplication;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.UniversityApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin/university-applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminUniversityApplicationController {

    private final UniversityApplicationService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UniversityApplicationResponse>>> list(
            @RequestParam(required = false) UniversityApplication.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                "Applications", service.list(status, page, size)));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> pendingCount() {
        Map<String, Long> data = new HashMap<>();
        data.put("pending", service.countPending());
        return ResponseEntity.ok(ApiResponse.success("Count", data));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<UniversityApplicationResponse>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Approved. A password-setup email has been sent to the admin.",
                service.approve(id, principal.getId())));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<UniversityApplicationResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(ApiResponse.success(
                "Application rejected", service.reject(id, reason)));
    }
}