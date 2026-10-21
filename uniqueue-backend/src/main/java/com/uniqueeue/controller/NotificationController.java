package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.model.Notification;
import com.uniqueeue.repository.NotificationRepository;
import com.uniqueeue.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    /** Badge count for the bell. */
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Unread count", Map.of("count", count)));
    }

    /** List all notifications (newest first). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> list = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", list));
    }

    /** Mark a single notification as read. */
    @PostMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        notificationRepository.markRead(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    /** Mark every unread notification as read. */
    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationRepository.markAllRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All marked as read", null));
    }
}