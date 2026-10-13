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

        University universityValue = universityRepository.findById(principal.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        // Identity / basics
        if (request.getName() != null && !request.getName().isBlank()) universityValue.setName(request.getName().trim());
        if (request.getEmailDomain() != null) universityValue.setEmailDomain(request.getEmailDomain().trim());
        if (request.getMatricPattern() != null) universityValue.setMatricPattern(request.getMatricPattern());
        if (request.getMatricExample() != null) universityValue.setMatricExample(request.getMatricExample());
        if (request.getMatricDescription() != null) universityValue.setMatricDescription(request.getMatricDescription());

        // Branding
        if (request.getLogoUrl() != null) universityValue.setLogoUrl(request.getLogoUrl().trim());
        if (request.getCampusImageUrl() != null) universityValue.setCampusImageUrl(request.getCampusImageUrl().trim());
        if (request.getTagline() != null) universityValue.setTagline(request.getTagline().trim());
        if (request.getPrimaryColor() != null) universityValue.setPrimaryColor(request.getPrimaryColor().trim());

        // Schedule
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            universityValue.setTimezone(request.getTimezone().trim());
        }

        if (request.getCountryCode() != null && !request.getCountryCode().isBlank()) {
            universityValue.setCountryCode(request.getCountryCode().trim().toUpperCase());
        }

        // Limits
        if (request.getMaxStaff() != null) universityValue.setMaxStaff(request.getMaxStaff());
        if (request.getMaxQueues() != null) universityValue.setMaxQueues(request.getMaxQueues());

        // Fresher registration config
        if (request.getFresherRegistrationEnabled() != null)
            universityValue.setFresherRegistrationEnabled(request.getFresherRegistrationEnabled());
        if (request.getFresherVerificationMode() != null)
            universityValue.setFresherVerificationMode(request.getFresherVerificationMode().toUpperCase());

        if (request.getRequireJambReg() != null) universityValue.setRequireJambReg(request.getRequireJambReg());
        if (request.getJambRegPattern() != null) universityValue.setJambRegPattern(request.getJambRegPattern());
        if (request.getJambRegExample() != null) universityValue.setJambRegExample(request.getJambRegExample());
        if (request.getJambRegDescription() != null) universityValue.setJambRegDescription(request.getJambRegDescription());

        if (request.getRequireAdmissionRef() != null) universityValue.setRequireAdmissionRef(request.getRequireAdmissionRef());
        if (request.getAdmissionRefPattern() != null) universityValue.setAdmissionRefPattern(request.getAdmissionRefPattern());
        if (request.getAdmissionRefExample() != null) universityValue.setAdmissionRefExample(request.getAdmissionRefExample());
        if (request.getAdmissionRefDescription() != null) universityValue.setAdmissionRefDescription(request.getAdmissionRefDescription());

        if (request.getRequireApplicationNumber() != null) universityValue.setRequireApplicationNumber(request.getRequireApplicationNumber());
        if (request.getApplicationNumberPattern() != null) universityValue.setApplicationNumberPattern(request.getApplicationNumberPattern());
        if (request.getApplicationNumberExample() != null) universityValue.setApplicationNumberExample(request.getApplicationNumberExample());
        if (request.getApplicationNumberDescription() != null) universityValue.setApplicationNumberDescription(request.getApplicationNumberDescription());

        University saved = universityRepository.save(universityValue);

        auditService.record(principal.getId(), principal.getUniversityId(),
                UNIVERSITY_UPDATED, "University", saved.getId(),
                "{\"source\":\"admin-settings\"}");

        return ResponseEntity.ok(ApiResponse.success("Settings updated", UniversityResponse.from(saved)));
    }
}