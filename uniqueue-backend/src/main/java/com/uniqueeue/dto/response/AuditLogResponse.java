package com.uniqueeue.dto.response;

import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.model.AuditLog;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLogResponse {

    private Long id;
    private Long userId;
    private Long universityId;
    private AuditAction action;
    private String entityType;
    private Long entityId;
    private String details;
    private String ipAddress;
    private LocalDateTime createdAt;

    public static AuditLogResponse from(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .userId(a.getUserId())
                .universityId(a.getUniversityId())
                .action(a.getAction())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .details(a.getDetails())
                .ipAddress(a.getIpAddress())
                .createdAt(a.getCreatedAt())
                .build();
    }
}