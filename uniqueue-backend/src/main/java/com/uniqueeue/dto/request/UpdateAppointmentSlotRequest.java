package com.uniqueeue.dto.request;

import com.uniqueeue.enums.AppointmentCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateAppointmentSlotRequest {

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

    @Min(5)
    @Max(240)
    private Integer durationMinutes;

    private String whatToBring;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 200, message = "Capacity must be at most 200")
    private Integer capacity;

    private Boolean isActive;
}