package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.service.BottleneckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/super-admin/bottlenecks")
@RequiredArgsConstructor
public class BottleneckController {

    private final BottleneckService bottleneckService;

    /**
     * Manually trigger a scan. Useful in dev to verify the feature end-to-end
     * without waiting for the hourly cron.
     */
    @PostMapping("/scan")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<BottleneckService.ScanResult>> scan() {
        return ResponseEntity.ok(ApiResponse.success(
                "Scan complete",
                bottleneckService.scan()));
    }
}