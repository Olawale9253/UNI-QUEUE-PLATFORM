package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateWorkflowStepRequest {

    @Size(max = 255)
    private String label;

    private String instructions;

    private Boolean isRequired;
}