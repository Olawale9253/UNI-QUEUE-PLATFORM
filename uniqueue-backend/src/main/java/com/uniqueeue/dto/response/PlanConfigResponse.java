package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniqueeue.model.PlanConfig;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanConfigResponse {

    private Long id;
    private String code;
    private String label;
    private Double priceUsd;
    private Integer maxQueues;
    private Integer maxStaff;
    private Integer maxTicketsPerDay;

    @JsonProperty("isActive")
    private Boolean isActive;

    private Integer displayOrder;
    private LocalDateTime updatedAt;

    public static PlanConfigResponse from(PlanConfig planConfig) {
        return PlanConfigResponse.builder()
                .id(planConfig.getId())
                .code(planConfig.getCode())
                .label(planConfig.getLabel())
                .priceUsd(planConfig.getPriceUsd())
                .maxQueues(planConfig.getMaxQueues())
                .maxStaff(planConfig.getMaxStaff())
                .maxTicketsPerDay(planConfig.getMaxTicketsPerDay())
                .isActive(planConfig.getIsActive())
                .displayOrder(planConfig.getDisplayOrder())
                .updatedAt(planConfig.getUpdatedAt())
                .build();
    }
}