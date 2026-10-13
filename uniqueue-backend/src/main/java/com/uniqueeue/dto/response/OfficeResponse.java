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

    public static OfficeResponse from(Office office) {
        return OfficeResponse.builder()
                .id(office.getId())
                .name(office.getName())
                .description(office.getDescription())
                .location(office.getLocation())
                .icon(office.getIcon())
                .openingTime(office.getOpeningTime())
                .closingTime(office.getClosingTime())
                .slotDurationMinutes(office.getSlotDurationMinutes())
                .isActive(office.getIsActive())
                .createdAt(office.getCreatedAt())
                .updatedAt(office.getUpdatedAt())
                .build();
    }
}