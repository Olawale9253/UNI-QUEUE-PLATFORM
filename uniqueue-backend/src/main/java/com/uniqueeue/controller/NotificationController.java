package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.NotificationResponse;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.countUnread(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Unread count", Map.of("count", count)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<NotificationResponse> list = notificationService.listForUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", list));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        notificationService.markAsRead(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All marked as read", null));
    }
}