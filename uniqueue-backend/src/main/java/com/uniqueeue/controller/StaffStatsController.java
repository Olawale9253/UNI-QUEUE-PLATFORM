package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.StaffStatsResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.StaffStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffStatsController {

    private final StaffStatsService staffStatsService;

    @GetMapping
    public ResponseEntity<ApiResponse<StaffStatsResponse>> stats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Stats", staffStatsService.stats(principal.getId())));
    }
}