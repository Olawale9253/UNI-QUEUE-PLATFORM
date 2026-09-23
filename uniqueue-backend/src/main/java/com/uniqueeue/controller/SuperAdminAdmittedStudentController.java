package com.uniqueeue.controller;

import com.uniqueeue.dto.response.AdmittedStudentResponse;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.service.AdmittedStudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin/universities/{universityId}/admitted-students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminAdmittedStudentController {

    private final AdmittedStudentService admittedStudentService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(
            @PathVariable Long universityId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "replace", defaultValue = "false") boolean replace) {
        int count = admittedStudentService.uploadCsv(universityId, file, replace);
        Map<String, Object> data = new HashMap<>();
        data.put("imported", count);
        data.put("replaced", replace);
        return ResponseEntity.ok(ApiResponse.success("Imported " + count + " rows", data));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdmittedStudentResponse>>> list(
            @PathVariable Long universityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<AdmittedStudentResponse> result = admittedStudentService
                .list(universityId, page, size)
                .map(AdmittedStudentResponse::from);
        return ResponseEntity.ok(ApiResponse.success("Admitted students", result));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats(@PathVariable Long universityId) {
        return ResponseEntity.ok(ApiResponse.success("Stats", admittedStudentService.stats(universityId)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Object>> clear(@PathVariable Long universityId) {
        admittedStudentService.clearAll(universityId);
        return ResponseEntity.ok(ApiResponse.success("Admitted list cleared", null));
    }
}