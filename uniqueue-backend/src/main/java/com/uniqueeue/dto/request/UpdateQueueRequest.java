package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateQueueRequest {

    @Size(max = 255)
    private String name;

    private String description;

    @Size(max = 100)
    private String department;

    @Size(max = 100)
    private String subDepartment;

    @Size(max = 255)
    private String location;

    private Boolean isActive;
    private LocalTime opensAt;
    private LocalTime closesAt;

    @Min(value = 1, message = "Max capacity must be at least 1")
    private Integer maxCapacity;

    @Min(value = 1, message = "Average service time must be at least 1 minute")
    private Integer averageServiceMinutes;

    private Boolean allowWaitlist;
    private Boolean autoPromoteWaitlist;

    @Min(value = 0, message = "Max waitlist size can't be negative")
    private Integer maxWaitlistSize;
}