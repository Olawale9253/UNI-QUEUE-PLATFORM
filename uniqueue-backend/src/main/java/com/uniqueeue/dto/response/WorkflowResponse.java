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

    public static WorkflowResponse from(Workflow w, List<WorkflowStep> steps,
                                        long inProgress, long completed) {
        return WorkflowResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .description(w.getDescription())
                .session(w.getSession())
                .isActive(w.getIsActive())
                .universityId(w.getUniversity() != null ? w.getUniversity().getId() : null)
                .universityName(w.getUniversity() != null ? w.getUniversity().getName() : null)
                .createdById(w.getCreatedBy() != null ? w.getCreatedBy().getId() : null)
                .createdByName(w.getCreatedBy() != null ? w.getCreatedBy().getFullName() : null)
                .stepCount(steps.size())
                .inProgressCount(inProgress)
                .completedCount(completed)
                .steps(steps.stream().map(s -> StepResponse.builder()
                        .id(s.getId())
                        .order(s.getStepOrder())
                        .queueId(s.getQueue() != null ? s.getQueue().getId() : null)
                        .queueName(s.getQueue() != null ? s.getQueue().getName() : null)
                        .label(s.getLabel())
                        .instructions(s.getInstructions())
                        .isRequired(s.getIsRequired())
                        .build()).toList())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}