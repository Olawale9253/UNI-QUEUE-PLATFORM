package com.uniqueeue.dto.request;

import com.uniqueeue.enums.AppointmentCategory;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateAppointmentSlotRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    private String description;

    private AppointmentCategory category;

    @Size(max = 255)
    private String faculty;

    @Size(max = 255)
    private String department;

    @Size(max = 255)
    private String location;

    @Size(max = 255)
    private String roomDetail;

    @Size(max = 100)
    private String staffRole;

    @Min(value = 5, message = "Duration must be at least 5 minutes")
    @Max(value = 240, message = "Duration cannot exceed 4 hours")
    private Integer durationMinutes;

    private String whatToBring;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 200, message = "Capacity must be at most 200")
    private Integer capacity;
}