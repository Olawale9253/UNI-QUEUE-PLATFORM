package com.uniqueeue.controller;

import com.uniqueeue.dto.request.BroadcastRequest;
import com.uniqueeue.dto.request.CreateAdminRequest;
import com.uniqueeue.dto.request.CreateUniversityRequest;
import com.uniqueeue.dto.request.UpdateFeaturesRequest;
import com.uniqueeue.dto.request.UpdatePlanConfigRequest;
import com.uniqueeue.dto.request.UpdatePlanRequest;
import com.uniqueeue.dto.request.UpdateUniversityRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.PlanConfigResponse;
import com.uniqueeue.dto.response.SystemAnalyticsResponse;
import com.uniqueeue.dto.response.UniversityResponse;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.JwtTokenProvider;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.BroadcastService;
import com.uniqueeue.service.PlanConfigService;
import com.uniqueeue.service.SystemAnalyticsService;
import com.uniqueeue.service.UniversityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final UniversityService universityService;
    private final SystemAnalyticsService systemAnalyticsService;
    private final BroadcastService broadcastService;
    private final PlanConfigService planConfigService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    // ============================================================
    //  UNIVERSITIES
    // ============================================================

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

    @PostMapping("/universities/{id}/deactivate")
    public ResponseEntity<ApiResponse<UniversityResponse>> deactivateUniversity(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "University deactivated", universityService.deactivate(id)));
    }

    @PostMapping("/universities/{id}/reactivate")
    public ResponseEntity<ApiResponse<UniversityResponse>> reactivateUniversity(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "University reactivated", universityService.reactivate(id)));
    }

    @DeleteMapping("/universities/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteUniversity(@PathVariable Long id) {
        universityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("University deleted", null));
    }

    @PutMapping("/universities/{id}/features")
    public ResponseEntity<ApiResponse<UniversityResponse>> updateFeatures(
            @PathVariable Long id,
            @RequestBody UpdateFeaturesRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Features updated",
                universityService.updateFeatures(id, request)));
    }

    @PutMapping("/universities/{id}/plan")
    public ResponseEntity<ApiResponse<UniversityResponse>> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Plan updated",
                universityService.updatePlan(id, request)));
    }

    @PostMapping("/universities/{id}/admins")
    public ResponseEntity<ApiResponse<UniversityResponse>> createAdmin(
            @PathVariable Long id,
            @Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admin created",
                        universityService.createAdmin(id, request)));
    }

    // ============================================================
    //  PLAN CONFIGS
    // ============================================================

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<PlanConfigResponse>>> listPlans() {
        return ResponseEntity.ok(ApiResponse.success("Plans", planConfigService.listAll()));
    }

    @PutMapping("/plans/{id}")
    public ResponseEntity<ApiResponse<PlanConfigResponse>> updatePlanConfig(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlanConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Plan updated", planConfigService.update(id, request)));
    }

    // ============================================================
    //  BROADCAST
    // ============================================================

    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<Map<String, Object>>> broadcast(
            @Valid @RequestBody BroadcastRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        int sent = broadcastService.send(principal.getId(), request);
        Map<String, Object> data = new HashMap<>();
        data.put("recipients", sent);
        return ResponseEntity.ok(ApiResponse.success(
                "Broadcast sent to " + sent + " users", data));
    }

    // ============================================================
    //  IMPERSONATION
    // ============================================================

    @PostMapping("/impersonate/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> impersonate(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!Boolean.TRUE.equals(target.getIsActive())) {
            throw new BadRequestException("Cannot impersonate a disabled user");
        }
        if (target.getRole() == com.uniqueeue.enums.Role.SUPER_ADMIN) {
            throw new BadRequestException("Cannot impersonate another super admin");
        }

        String token = tokenProvider.generateTokenForUser(target);

        Map<String, Object> data = new HashMap<>();
        data.put("accessToken", token);
        data.put("userId", target.getId());
        data.put("email", target.getEmail());
        data.put("fullName", target.getFullName());
        data.put("role", target.getRole().name());
        data.put("universityId", target.getUniversity() != null ? target.getUniversity().getId() : null);

        return ResponseEntity.ok(ApiResponse.success("Impersonation token issued", data));
    }

    // ============================================================
    //  SYSTEM ANALYTICS
    // ============================================================

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<SystemAnalyticsResponse>> analytics() {
        return ResponseEntity.ok(ApiResponse.success(
                "System analytics", systemAnalyticsService.overview()));
    }
}