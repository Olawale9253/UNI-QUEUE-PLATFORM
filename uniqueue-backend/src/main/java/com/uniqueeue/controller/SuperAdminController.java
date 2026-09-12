package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateAdminRequest;
import com.uniqueeue.dto.request.CreateUniversityRequest;
import com.uniqueeue.dto.request.UpdateUniversityRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.SystemAnalyticsResponse;
import com.uniqueeue.dto.response.UniversityResponse;
import com.uniqueeue.service.SystemAnalyticsService;
import com.uniqueeue.service.UniversityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final UniversityService universityService;
    private final SystemAnalyticsService systemAnalyticsService;

    // ---------- UNIVERSITIES ----------

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<UniversityResponse>>> listUniversities() {
        return ResponseEntity.ok(ApiResponse.success("Universities", universityService.listAll()));
    }

    @GetMapping("/universities/{id}")
    public ResponseEntity<ApiResponse<UniversityResponse>> getUniversity(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("University", universityService.getById(id)));
    }

    @PostMapping("/universities")
    public ResponseEntity<ApiResponse<UniversityResponse>> createUniversity(
            @Valid @RequestBody CreateUniversityRequest request) {
        UniversityResponse created = universityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("University created", created));
    }

    @PutMapping("/universities/{id}")
    public ResponseEntity<ApiResponse<UniversityResponse>> updateUniversity(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUniversityRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "University updated", universityService.update(id, request)));
    }

    /**
     * Soft delete — marks the university as inactive.
     * All data is preserved. Logins for this university are blocked.
     */
    @PostMapping("/universities/{id}/deactivate")
    public ResponseEntity<ApiResponse<UniversityResponse>> deactivateUniversity(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "University deactivated", universityService.deactivate(id)));
    }

    /**
     * Reactivate a previously deactivated university.
     */
    @PostMapping("/universities/{id}/reactivate")
    public ResponseEntity<ApiResponse<UniversityResponse>> reactivateUniversity(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "University reactivated", universityService.reactivate(id)));
    }

    // ---------- ADMINS ----------

    @PostMapping("/universities/{id}/admins")
    public ResponseEntity<ApiResponse<UniversityResponse>> createAdmin(
            @PathVariable Long id,
            @Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admin created",
                        universityService.createAdmin(id, request)));
    }

    // ---------- SYSTEM ANALYTICS ----------

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<SystemAnalyticsResponse>> analytics() {
        return ResponseEntity.ok(ApiResponse.success(
                "System analytics", systemAnalyticsService.overview()));
    }
}