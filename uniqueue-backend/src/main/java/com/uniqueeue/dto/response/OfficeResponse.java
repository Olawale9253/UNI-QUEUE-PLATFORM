package com.uniqueeue.dto.response;

import com.uniqueeue.model.Office;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OfficeResponse {

    private Long id;
    private String name;
    private String description;
    private String location;
    private String icon;

    private LocalTime openingTime;
    private LocalTime closingTime;
    private Integer slotDurationMinutes;

    private Boolean isActive;

    private Long serviceCount;
    private Long staffCount;
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
                .openingTime(o.getOpeningTime())
                .closingTime(o.getClosingTime())
                .slotDurationMinutes(o.getSlotDurationMinutes())
                .isActive(o.getIsActive())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}