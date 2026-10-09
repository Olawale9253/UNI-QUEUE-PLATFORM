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

    /** List the current user's most recent notifications. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Notifications",
                notificationService.listForUser(principal.getId())));
    }

    /**
     * Unread count.
     * Serves both `/unread-count` (new) and `/unread/count` (what the existing
     * NotificationBell.jsx calls) so either URL works.
     */
    @GetMapping({"/unread-count", "/unread/count"})
    public ResponseEntity<ApiResponse<Map<String, Long>>> unread(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.countUnread(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Unread count",
                Map.of("count", count)));
    }

    /** Mark a single notification as read. */
    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Marked read",
                notificationService.markAsRead(principal.getId(), id)));
    }

    /** Mark every notification for the current user as read. */
    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All marked read", null));
    }
}