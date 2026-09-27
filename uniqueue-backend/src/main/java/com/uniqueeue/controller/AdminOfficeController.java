package com.uniqueeue.controller;

import com.uniqueeue.dto.request.CreateOfficeRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.OfficeResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.OfficeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/offices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOfficeController {

    private final OfficeService officeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OfficeResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Offices", officeService.list(principal.getUniversityId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OfficeResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Office", officeService.getById(id, principal.getUniversityId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OfficeResponse>> create(
            @Valid @RequestBody CreateOfficeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Office created",
                        officeService.create(principal.getUniversityId(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OfficeResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateOfficeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Office updated",
                officeService.update(id, principal.getUniversityId(), request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        officeService.delete(id, principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Office deleted", null));
    }
}