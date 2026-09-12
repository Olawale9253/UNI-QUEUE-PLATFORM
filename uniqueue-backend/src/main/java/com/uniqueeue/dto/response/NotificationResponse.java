package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.model.Notification;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private NotificationType type;

    @JsonProperty("isRead")
    private Boolean isRead;

    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}