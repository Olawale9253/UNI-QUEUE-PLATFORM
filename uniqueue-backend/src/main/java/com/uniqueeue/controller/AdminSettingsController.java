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
        University university = universityRepository.findById(principal.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        return ResponseEntity.ok(ApiResponse.success("Settings", UniversityResponse.from(university)));
    }

    @PutMapping
    @Transactional
    public ResponseEntity<ApiResponse<UniversityResponse>> update(
            @RequestBody UpdateUniversitySettingsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        University u = universityRepository.findById(principal.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        // Identity / basics
        if (request.getName() != null && !request.getName().isBlank()) u.setName(request.getName().trim());
        if (request.getEmailDomain() != null) u.setEmailDomain(request.getEmailDomain().trim());
        if (request.getMatricPattern() != null) u.setMatricPattern(request.getMatricPattern());
        if (request.getMatricExample() != null) u.setMatricExample(request.getMatricExample());
        if (request.getMatricDescription() != null) u.setMatricDescription(request.getMatricDescription());
        if (request.getMatricVerificationMode() != null)
            u.setMatricVerificationMode(request.getMatricVerificationMode().toUpperCase());

        // Branding
        if (request.getLogoUrl() != null) u.setLogoUrl(request.getLogoUrl().trim());
        if (request.getCampusImageUrl() != null) u.setCampusImageUrl(request.getCampusImageUrl().trim());
        if (request.getTagline() != null) u.setTagline(request.getTagline().trim());
        if (request.getPrimaryColor() != null) u.setPrimaryColor(request.getPrimaryColor().trim());

        // Schedule
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            u.setTimezone(request.getTimezone().trim());
        }
        if (request.getCountryCode() != null && !request.getCountryCode().isBlank()) {
            u.setCountryCode(request.getCountryCode().trim().toUpperCase());
        }

        // Limits
        if (request.getMaxStaff() != null) u.setMaxStaff(request.getMaxStaff());
        if (request.getMaxQueues() != null) u.setMaxQueues(request.getMaxQueues());

        // Fresher config
        if (request.getFresherRegistrationEnabled() != null)
            u.setFresherRegistrationEnabled(request.getFresherRegistrationEnabled());
        if (request.getFresherVerificationMode() != null)
            u.setFresherVerificationMode(request.getFresherVerificationMode().toUpperCase());

        if (request.getRequireJambReg() != null) u.setRequireJambReg(request.getRequireJambReg());
        if (request.getJambRegPattern() != null) u.setJambRegPattern(request.getJambRegPattern());
        if (request.getJambRegExample() != null) u.setJambRegExample(request.getJambRegExample());
        if (request.getJambRegDescription() != null) u.setJambRegDescription(request.getJambRegDescription());

        if (request.getRequireAdmissionRef() != null) u.setRequireAdmissionRef(request.getRequireAdmissionRef());
        if (request.getAdmissionRefPattern() != null) u.setAdmissionRefPattern(request.getAdmissionRefPattern());
        if (request.getAdmissionRefExample() != null) u.setAdmissionRefExample(request.getAdmissionRefExample());
        if (request.getAdmissionRefDescription() != null) u.setAdmissionRefDescription(request.getAdmissionRefDescription());

        if (request.getRequireApplicationNumber() != null) u.setRequireApplicationNumber(request.getRequireApplicationNumber());
        if (request.getApplicationNumberPattern() != null) u.setApplicationNumberPattern(request.getApplicationNumberPattern());
        if (request.getApplicationNumberExample() != null) u.setApplicationNumberExample(request.getApplicationNumberExample());
        if (request.getApplicationNumberDescription() != null) u.setApplicationNumberDescription(request.getApplicationNumberDescription());

        University saved = universityRepository.save(u);

        auditService.record(principal.getId(), principal.getUniversityId(),
                UNIVERSITY_UPDATED, "University", saved.getId(),
                "{\"source\":\"admin-settings\"}");

        return ResponseEntity.ok(ApiResponse.success("Settings updated", UniversityResponse.from(saved)));
    }
}