package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniqueeue.enums.AppointmentCategory;
import com.uniqueeue.model.AppointmentSlot;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentSlotResponse {

    private Long id;
    private String title;
    private String description;
    private AppointmentCategory category;

    private String faculty;
    private String department;
    private String location;
    private String roomDetail;

    private String staffRole;
    private Integer durationMinutes;
    private String whatToBring;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer capacity;
    private long bookedCount;
    private long remaining;
    private String status;

    @JsonProperty("isActive")
    private Boolean isActive;

    private Long staffId;
    private String staffName;
    private Long universityId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AppointmentSlotResponse from(AppointmentSlot s, long bookedCount) {
        LocalDateTime now = LocalDateTime.now();
        long remaining = Math.max(0, s.getCapacity() - bookedCount);

        String status;
        if (!Boolean.TRUE.equals(s.getIsActive())) {
            status = "CLOSED";
        } else if (s.getEndTime() != null && s.getEndTime().isBefore(now)) {
            status = "PAST";
        } else if (remaining <= 0) {
            status = "FULL";
        } else {
            status = "AVAILABLE";
        }

        return AppointmentSlotResponse.builder()
                .id(s.getId())
                .title(s.getTitle())
                .description(s.getDescription())
                .category(s.getCategory())
                .faculty(s.getFaculty())
                .department(s.getDepartment())
                .location(s.getLocation())
                .roomDetail(s.getRoomDetail())
                .staffRole(s.getStaffRole())
                .durationMinutes(s.getDurationMinutes())
                .whatToBring(s.getWhatToBring())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .capacity(s.getCapacity())
                .bookedCount(bookedCount)
                .remaining(remaining)
                .status(status)
                .isActive(s.getIsActive())
                .staffId(s.getStaff() != null ? s.getStaff().getId() : null)
                .staffName(s.getStaff() != null ? s.getStaff().getFullName() : null)
                .universityId(s.getUniversity() != null ? s.getUniversity().getId() : null)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}