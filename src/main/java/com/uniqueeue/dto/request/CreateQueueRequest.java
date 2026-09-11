package com.uniqueeue.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateQueueRequest {

    @NotBlank(message = "Queue name is required")
    @Size(max = 255)
    private String name;

    private String description;

    @Size(max = 100)
    private String department;

    @Size(max = 255)
    private String location;

    private LocalTime opensAt;

    private LocalTime closesAt;

    @Min(value = 1, message = "Max capacity must be at least 1")
    private Integer maxCapacity;

    @Min(value = 1, message = "Average service time must be at least 1 minute")
    private Integer averageServiceMinutes;
}