package com.uniqueeue.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdatePlanRequest {

    @NotBlank(message = "Plan is required")
    private String plan; // FREE, BASIC, PREMIUM, ENTERPRISE
}