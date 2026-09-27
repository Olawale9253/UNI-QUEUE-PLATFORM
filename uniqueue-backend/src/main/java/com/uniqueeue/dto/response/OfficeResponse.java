package com.uniqueeue.dto.response;

import com.uniqueeue.model.Office;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OfficeResponse {

    private Long id;
    private String name;
    private String description;
    private String location;
    private String icon;
    private Boolean isActive;

    /** How many services (queues) belong to this office. */
    private Long serviceCount;

    /** How many staff are assigned across all its services. */
    private Long staffCount;

    /** Total tickets currently waiting across all its services. */
    private Long waitingCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OfficeResponse from(Office o) {
        return OfficeResponse.builder()
                .id(o.getId())
                .name(o.getName())
                .description(o.getDescription())
                .location(o.getLocation())
                .icon(o.getIcon())
                .isActive(o.getIsActive())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}