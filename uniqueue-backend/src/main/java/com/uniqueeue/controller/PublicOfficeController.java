package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.OfficeResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.OfficeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Office listing for non-admin users (students, freshers, staff).
 * Read-only — no create/update/delete.
 */
@RestController
@RequestMapping("/api/offices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'FRESHER', 'STAFF', 'ADMIN')")
public class PublicOfficeController {

    private final OfficeService officeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OfficeResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Offices", officeService.list(principal.getUniversityId())));
    }
}