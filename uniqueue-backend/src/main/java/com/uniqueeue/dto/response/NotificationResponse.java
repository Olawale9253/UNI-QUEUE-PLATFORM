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

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType() != null ? n.getType().name() : "SYSTEM")
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .isRead(Boolean.TRUE.equals(n.getIsRead()))
                .createdAt(n.getCreatedAt())
                .build();
    }
}