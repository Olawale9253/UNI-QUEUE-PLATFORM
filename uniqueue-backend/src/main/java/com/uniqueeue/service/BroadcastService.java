package com.uniqueeue.service;

import com.uniqueeue.dto.request.BroadcastRequest;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.model.Notification;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.NotificationRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BroadcastService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuditService auditService;

    @Transactional
    public int send(Long senderId, BroadcastRequest request) {
        List<User> recipients = resolveRecipients(senderId, request);

        if (recipients.isEmpty()) {
            throw new BadRequestException("No recipients match the current filters");
        }

        List<Notification> notifications = new ArrayList<>(recipients.size());
        for (User u : recipients) {
            notifications.add(Notification.builder()
                    .user(u)
                    .type(NotificationType.BROADCAST)
                    .title(request.getTitle())
                    .message(request.getMessage())
                    .isRead(false)
                    .build());
        }

        notificationRepository.saveAll(notifications);

        auditService.record(senderId, request.getUniversityId(),
                AuditAction.UNIVERSITY_UPDATED,
                "Broadcast", null,
                "{\"title\":\"" + escape(request.getTitle()) +
                        "\",\"recipients\":" + recipients.size() +
                        ",\"universityId\":" + request.getUniversityId() +
                        ",\"role\":\"" + request.getRole() + "\"}");

        log.info("Broadcast sent to {} users by super admin {}", recipients.size(), senderId);
        return recipients.size();
    }

    private List<User> resolveRecipients(Long senderId, BroadcastRequest request) {
        Role roleFilter = null;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                roleFilter = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid role: " + request.getRole());
            }
        }

        List<User> all = userRepository.findAll();
        List<User> recipients = new ArrayList<>();

        for (User u : all) {
            if (!Boolean.TRUE.equals(u.getIsActive())) continue;

            // Never send to the sender
            if (u.getId().equals(senderId)) continue;

            // Never auto-send to super admins unless explicitly targeted
            if (roleFilter == null && u.getRole() == Role.SUPER_ADMIN) continue;

            // If a role was explicitly chosen, only that role matches
            if (roleFilter != null && u.getRole() != roleFilter) continue;

            if (request.getUniversityId() != null) {
                if (u.getUniversity() == null) continue;
                if (!u.getUniversity().getId().equals(request.getUniversityId())) continue;
            }

            recipients.add(u);
        }

        return recipients;
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}