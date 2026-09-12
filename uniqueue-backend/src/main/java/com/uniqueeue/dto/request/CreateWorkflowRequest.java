package com.uniqueeue.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateWorkflowRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;

    private String description;

    @Size(max = 100)
    private String session;

    /** Ordered list of steps. Must have at least 1. */
    @NotEmpty(message = "Workflow must have at least one step")
    @Valid
    private List<StepInput> steps;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StepInput {

        @NotNull(message = "Queue ID is required for each step")
        private Long queueId;

        @Size(max = 255)
        private String label;

        private String instructions;

        private Boolean isRequired;
    }
}