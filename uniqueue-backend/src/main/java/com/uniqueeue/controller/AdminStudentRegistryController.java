package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.StudentRegistryResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.StudentRegistryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/student-registry")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStudentRegistryController {

    private final StudentRegistryService registryService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "replace", defaultValue = "false") boolean replace,
            @AuthenticationPrincipal UserPrincipal principal) {
        int count = registryService.uploadCsv(principal.getUniversityId(), file, replace);
        Map<String, Object> data = new HashMap<>();
        data.put("imported", count);
        data.put("replaced", replace);
        return ResponseEntity.ok(ApiResponse.success("Imported " + count + " rows", data));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StudentRegistryResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        Page<StudentRegistryResponse> result = registryService
                .list(principal.getUniversityId(), page, size)
                .map(StudentRegistryResponse::from);
        return ResponseEntity.ok(ApiResponse.success("Student registry", result));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Stats", registryService.stats(principal.getUniversityId())));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Object>> clear(
            @AuthenticationPrincipal UserPrincipal principal) {
        registryService.clearAll(principal.getUniversityId());
        return ResponseEntity.ok(ApiResponse.success("Registry cleared", null));
    }
}