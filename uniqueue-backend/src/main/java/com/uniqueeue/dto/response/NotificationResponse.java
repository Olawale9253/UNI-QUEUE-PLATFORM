package com.uniqueeue.dto.response;

import com.uniqueeue.model.Notification;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {

    private Long id;
    private String type;
    private String title;
    private String message;
    private String link;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType() != null ? notification.getType() : "SYSTEM")
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(Boolean.TRUE.equals(notification.getIsRead()))
                .createdAt(notification.getCreatedAt())
                .build();
    }
}