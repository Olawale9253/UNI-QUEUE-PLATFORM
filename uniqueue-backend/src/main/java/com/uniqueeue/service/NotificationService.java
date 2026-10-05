package com.uniqueeue.service;

import com.uniqueeue.dto.response.NotificationResponse;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Notification;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.NotificationRepository;
import com.uniqueeue.security.TenantGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebPushService webPushService;

    /**
     * Fire-and-forget notification. Failures are logged but never break the caller.
     */
    @Transactional
    public void notify(User user, NotificationType type, String title, String message) {
        if (user == null) return;
        try {
            Notification n = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .build();
            notificationRepository.save(n);
            webPushService.sendToUser(user.getId(), title, message, Map.of("type", type.name()));
        } catch (Exception ex) {
            log.error("Failed to send notification to user {}: {}", user.getId(), ex.getMessage());

        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listUnread(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!n.getUser().getId().equals(TenantGuard.currentUserId())) {
            throw new ResourceNotFoundException("Notification not found");
        }
        n.setIsRead(true);
        return NotificationResponse.from(notificationRepository.save(n));
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}