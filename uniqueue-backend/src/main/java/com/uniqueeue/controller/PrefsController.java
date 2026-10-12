package com.uniqueeue.controller;

import com.uniqueeue.dto.request.UpdateNotificationPrefsRequest;
import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.NotificationPrefsResponse;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/prefs")
@RequiredArgsConstructor
public class PrefsController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationPrefsResponse>> get(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(
                "Preferences", NotificationPrefsResponse.from(user)));
    }

    @PatchMapping
    @Transactional
    public ResponseEntity<ApiResponse<NotificationPrefsResponse>> patch(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateNotificationPrefsRequest request) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getSoundEnabled() != null) user.setSoundEnabled(request.getSoundEnabled());
        if (request.getPushEnabled() != null) user.setPushEnabled(request.getPushEnabled());
        if (request.getTicketEmailsEnabled() != null) user.setTicketEmailsEnabled(request.getTicketEmailsEnabled());

        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success(
                "Preferences updated", NotificationPrefsResponse.from(user)));
    }
}