package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdatePlanConfigRequest {

    @Size(max = 100)
    private String label;

    @Min(value = 0, message = "Price cannot be negative")
    private Double priceUsd;

    @Min(value = 1, message = "Max queues must be at least 1")
    private Integer maxQueues;

    @Min(value = 1, message = "Max staff must be at least 1")
    private Integer maxStaff;

    @Min(value = 1, message = "Max tickets/day must be at least 1")
    private Integer maxTicketsPerDay;

    private Boolean isActive;

    private Integer displayOrder;
}