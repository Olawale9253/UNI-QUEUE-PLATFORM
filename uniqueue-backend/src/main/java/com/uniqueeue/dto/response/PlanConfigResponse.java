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

    public static PlanConfigResponse from(PlanConfig p) {
        return PlanConfigResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .label(p.getLabel())
                .priceUsd(p.getPriceUsd())
                .maxQueues(p.getMaxQueues())
                .maxStaff(p.getMaxStaff())
                .maxTicketsPerDay(p.getMaxTicketsPerDay())
                .isActive(p.getIsActive())
                .displayOrder(p.getDisplayOrder())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}