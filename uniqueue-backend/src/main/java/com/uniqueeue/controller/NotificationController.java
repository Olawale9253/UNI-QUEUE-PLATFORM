package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.model.Notification;
import com.uniqueeue.repository.NotificationRepository;
import com.uniqueeue.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {

        // Fetch notifications for the logged-in user, ordered by newest first
        List<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(principal.getId());

        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", notifications));
    }
}