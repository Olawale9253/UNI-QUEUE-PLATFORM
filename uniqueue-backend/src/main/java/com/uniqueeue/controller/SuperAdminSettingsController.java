package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.model.PlatformSetting;
import com.uniqueeue.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/super-admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminSettingsController {

    private final PlatformSettingRepository settingRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PlatformSetting>> getSettings() {
        PlatformSetting settings = settingRepository.findById(1L)
                .orElseGet(() -> settingRepository.save(new PlatformSetting()));
        return ResponseEntity.ok(ApiResponse.success("Settings", settings));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<PlatformSetting>> updateSettings(@RequestBody Map<String, Object> body) {
        PlatformSetting settings = settingRepository.findById(1L)
                .orElseGet(() -> settingRepository.save(new PlatformSetting()));

        if (body.containsKey("ngnExchangeRate")) {
            settings.setNgnExchangeRate(Double.valueOf(body.get("ngnExchangeRate").toString()));
        }

        return ResponseEntity.ok(ApiResponse.success("Settings updated", settingRepository.save(settings)));
    }
}