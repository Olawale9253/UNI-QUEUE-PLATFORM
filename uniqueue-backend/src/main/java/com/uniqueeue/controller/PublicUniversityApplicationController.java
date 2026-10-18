package com.uniqueeue.controller;

import com.uniqueeue.dto.request.SubmitUniversityApplicationRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.UniversityApplicationResponse;
import com.uniqueeue.ratelimit.RateKeyType;
import com.uniqueeue.ratelimit.RateLimited;
import com.uniqueeue.service.UniversityApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/university-applications")
@RequiredArgsConstructor
public class PublicUniversityApplicationController {

    private final UniversityApplicationService service;

    @PostMapping
    @RateLimited(limit = 3, windowSeconds = 3600,
            keyType = RateKeyType.IP, name = "university-application")
    public ResponseEntity<ApiResponse<UniversityApplicationResponse>> submit(
            @Valid @RequestBody SubmitUniversityApplicationRequest request) {

        UniversityApplicationResponse response = service.submit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Thanks! Our team will review your application and email you within 24 hours.",
                response));
    }
}