package com.uniqueeue.controller;

import com.uniqueeue.dto.request.UpdateUniversitySettingsRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.UniversityResponse;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.University;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import static com.uniqueeue.enums.AuditAction.UNIVERSITY_UPDATED;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final UniversityRepository universityRepository;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<UniversityResponse>> get(
            @AuthenticationPrincipal UserPrincipal principal) {
        University u = universityRepository.findById(principal.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        return ResponseEntity.ok(ApiResponse.success("Settings", UniversityResponse.from(u)));
    }

    @PutMapping
    @Transactional
    public ResponseEntity<ApiResponse<UniversityResponse>> update(
            @RequestBody UpdateUniversitySettingsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        University u = universityRepository.findById(principal.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            u.setName(request.getName().trim());
        }
        if (request.getEmailDomain() != null) u.setEmailDomain(request.getEmailDomain().trim());
        if (request.getMatricPattern() != null) u.setMatricPattern(request.getMatricPattern());
        if (request.getMatricExample() != null) u.setMatricExample(request.getMatricExample());
        if (request.getMatricDescription() != null) u.setMatricDescription(request.getMatricDescription());

        // ─── Branding ───
        if (request.getLogoUrl() != null) u.setLogoUrl(request.getLogoUrl().trim());
        if (request.getCampusImageUrl() != null) u.setCampusImageUrl(request.getCampusImageUrl().trim());
        if (request.getTagline() != null) u.setTagline(request.getTagline().trim());
        if (request.getPrimaryColor() != null) u.setPrimaryColor(request.getPrimaryColor().trim());

        if (request.getMaxStaff() != null) u.setMaxStaff(request.getMaxStaff());
        if (request.getMaxQueues() != null) u.setMaxQueues(request.getMaxQueues());

        University saved = universityRepository.save(u);

        auditService.record(principal.getId(), principal.getUniversityId(),
                UNIVERSITY_UPDATED, "University", saved.getId(),
                "{\"source\":\"admin-settings\"}");

        return ResponseEntity.ok(ApiResponse.success("Settings updated", UniversityResponse.from(saved)));
    }
}