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

    private String officeName;

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

    public static AppointmentSlotResponse from(AppointmentSlot appointmentSlot, long bookedCount) {
        LocalDateTime now = LocalDateTime.now();
        long remaining = Math.max(0, appointmentSlot.getCapacity() - bookedCount);

        String status;
        if (!Boolean.TRUE.equals(appointmentSlot.getIsActive())) {
            status = "CLOSED";
        } else if (appointmentSlot.getEndTime() != null && appointmentSlot.getEndTime().isBefore(now)) {
            status = "PAST";
        } else if (remaining <= 0) {
            status = "FULL";
        } else {
            status = "AVAILABLE";
        }

        return AppointmentSlotResponse.builder()
                .id(appointmentSlot.getId())
                .title(appointmentSlot.getTitle())
                .description(appointmentSlot.getDescription())
                .category(appointmentSlot.getCategory())
                .officeName(computeOfficeName(appointmentSlot))
                .faculty(appointmentSlot.getFaculty())
                .department(appointmentSlot.getDepartment())
                .location(appointmentSlot.getLocation())
                .roomDetail(appointmentSlot.getRoomDetail())
                .staffRole(appointmentSlot.getStaffRole())
                .durationMinutes(appointmentSlot.getDurationMinutes())
                .whatToBring(appointmentSlot.getWhatToBring())
                .startTime(appointmentSlot.getStartTime())
                .endTime(appointmentSlot.getEndTime())
                .capacity(appointmentSlot.getCapacity())
                .bookedCount(bookedCount)
                .remaining(remaining)
                .status(status)
                .isActive(appointmentSlot.getIsActive())
                .staffId(appointmentSlot.getStaff() != null ? appointmentSlot.getStaff().getId() : null)
                .staffName(appointmentSlot.getStaff() != null ? appointmentSlot.getStaff().getFullName() : null)
                .universityId(appointmentSlot.getUniversity() != null ? appointmentSlot.getUniversity().getId() : null)
                .createdAt(appointmentSlot.getCreatedAt())
                .updatedAt(appointmentSlot.getUpdatedAt())
                .build();
    }

    private static String computeOfficeName(AppointmentSlot appointmentSlotValue) {
        if (appointmentSlotValue.getDepartment() != null && !appointmentSlotValue.getDepartment().isBlank()) {
            return appointmentSlotValue.getDepartment().trim();
        }
        if (appointmentSlotValue.getFaculty() != null && !appointmentSlotValue.getFaculty().isBlank()) {
            return appointmentSlotValue.getFaculty().trim();
        }
        return "General Office";
    }
}