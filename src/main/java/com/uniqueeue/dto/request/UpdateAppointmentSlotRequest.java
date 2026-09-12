package com.uniqueeue.dto.request;

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

    @Size(max = 255)
    private String location;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 200, message = "Capacity must be at most 200")
    private Integer capacity;

    private Boolean isActive;
}