package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.University;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.PublicHolidaySyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lets an admin trigger a manual holiday sync for their own university.
 * Useful when onboarding — no need to wait for the 02:00 cron.
 */
@RestController
@RequestMapping("/api/admin/holidays")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHolidaySyncController {

    private final PublicHolidaySyncService syncService;
    private final UniversityRepository universityRepository;

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncNow(
            @AuthenticationPrincipal UserPrincipal principal) {

        University uni = universityRepository.findById(principal.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        PublicHolidaySyncService.SyncResult r = syncService.syncOne(uni);

        return ResponseEntity.ok(ApiResponse.success(
                "Sync complete",
                Map.of(
                        "added", r.holidaysAdded(),
                        "skipped", r.holidaysSkipped(),
                        "countryCode", uni.getCountryCode()
                )));
    }
}