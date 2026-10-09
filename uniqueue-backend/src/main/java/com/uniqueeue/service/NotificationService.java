package com.uniqueeue.service;

import com.uniqueeue.dto.response.NotificationResponse;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Notification;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AsyncPushService asyncPushService;

    /** Fire-and-forget notification with no deep-link. */
    @Transactional
    public void notify(User user, NotificationType type, String title, String message) {
        notify(user, type, title, message, null);
    }

    /**
     * Fire-and-forget notification with optional deep-link.
     *
     * Persists the in-app notification synchronously (fast DB write), then hands
     * the Web Push off to AsyncPushService so the request thread returns immediately.
     * The push runs on the "pushExecutor" thread pool.
     */
    @Transactional
    public void notify(User user, NotificationType type, String title, String message, String link) {
        if (user == null) return;
        try {
            Notification n = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .link(link)
                    .isRead(false)
                    .build();
            notificationRepository.save(n);

            Map<String, Object> data = new HashMap<>();
            data.put("type", type.name());
            if (link != null) data.put("link", link);

            // Off-thread: returns instantly, HTTP push happens in the background.
            asyncPushService.send(user.getId(), title, message, data);
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

        if (!n.getUser().getId().equals(userId)) {
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