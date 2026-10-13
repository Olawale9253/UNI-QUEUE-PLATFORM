package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniqueeue.model.Workflow;
import com.uniqueeue.model.WorkflowStep;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkflowResponse {

    private Long id;
    private String name;
    private String description;
    private String session;

    @JsonProperty("isActive")
    private Boolean isActive;

    private Long universityId;
    private String universityName;
    private Long createdById;
    private String createdByName;

    private int stepCount;
    private long inProgressCount;
    private long completedCount;

    private List<StepResponse> steps;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StepResponse {
        private Long id;
        private Integer order;
        private Long queueId;
        private String queueName;
        private String label;
        private String instructions;

        @JsonProperty("isRequired")
        private Boolean isRequired;
    }

    public static WorkflowResponse from(Workflow workflow, List<WorkflowStep> steps,
                                        long inProgress, long completed) {
        return WorkflowResponse.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .session(workflow.getSession())
                .isActive(workflow.getIsActive())
                .universityId(workflow.getUniversity() != null ? workflow.getUniversity().getId() : null)
                .universityName(workflow.getUniversity() != null ? workflow.getUniversity().getName() : null)
                .createdById(workflow.getCreatedBy() != null ? workflow.getCreatedBy().getId() : null)
                .createdByName(workflow.getCreatedBy() != null ? workflow.getCreatedBy().getFullName() : null)
                .stepCount(steps.size())
                .inProgressCount(inProgress)
                .completedCount(completed)
                .steps(steps.stream().map(workflowStepValue2 -> StepResponse.builder()
                        .id(workflowStepValue2.getId())
                        .order(workflowStepValue2.getStepOrder())
                        .queueId(workflowStepValue2.getQueue() != null ? workflowStepValue2.getQueue().getId() : null)
                        .queueName(workflowStepValue2.getQueue() != null ? workflowStepValue2.getQueue().getName() : null)
                        .label(workflowStepValue2.getLabel())
                        .instructions(workflowStepValue2.getInstructions())
                        .isRequired(workflowStepValue2.getIsRequired())
                        .build()).toList())
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .build();
    }
}