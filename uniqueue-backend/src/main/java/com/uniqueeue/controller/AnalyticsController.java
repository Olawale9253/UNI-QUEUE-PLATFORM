package com.uniqueeue.controller;

import com.uniqueeue.dto.response.AdminAnalyticsResponse;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AdminAnalyticsResponse>> analytics(
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminAnalyticsResponse data = analyticsService.forUniversity(principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Analytics", data));
    }
}