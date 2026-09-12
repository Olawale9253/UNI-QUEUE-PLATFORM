package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniqueeue.enums.WorkflowStatus;
import com.uniqueeue.model.StudentWorkflow;
import com.uniqueeue.model.WorkflowStep;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentWorkflowResponse {

    private Long id;
    private Long workflowId;
    private String workflowName;
    private String session;
    private WorkflowStatus status;
    private Integer currentStepOrder;
    private int totalSteps;
    private int completedSteps;

    private Long currentQueueId;
    private String currentQueueName;

    private List<StepStatus> steps;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StepStatus {
        private Integer order;
        private Long queueId;
        private String queueName;
        private String label;
        private String state;         // COMPLETED, CURRENT, LOCKED

        @JsonProperty("isRequired")
        private Boolean isRequired;
    }

    public static StudentWorkflowResponse from(StudentWorkflow sw, List<WorkflowStep> steps) {
        int total = steps.size();
        int current = sw.getCurrentStepOrder();

        List<StepStatus> stepStates = steps.stream().map(s -> {
            String state;
            if (sw.getStatus() == WorkflowStatus.COMPLETED) {
                state = "COMPLETED";
            } else if (s.getStepOrder() < current) {
                state = "COMPLETED";
            } else if (s.getStepOrder().equals(current)) {
                state = "CURRENT";
            } else {
                state = "LOCKED";
            }
            return StepStatus.builder()
                    .order(s.getStepOrder())
                    .queueId(s.getQueue() != null ? s.getQueue().getId() : null)
                    .queueName(s.getQueue() != null ? s.getQueue().getName() : null)
                    .label(s.getLabel())
                    .state(state)
                    .isRequired(s.getIsRequired())
                    .build();
        }).toList();

        WorkflowStep currentStep = steps.stream()
                .filter(s -> s.getStepOrder().equals(current))
                .findFirst().orElse(null);

        return StudentWorkflowResponse.builder()
                .id(sw.getId())
                .workflowId(sw.getWorkflow().getId())
                .workflowName(sw.getWorkflow().getName())
                .session(sw.getWorkflow().getSession())
                .status(sw.getStatus())
                .currentStepOrder(current)
                .totalSteps(total)
                .completedSteps(sw.getStatus() == WorkflowStatus.COMPLETED ? total : current - 1)
                .currentQueueId(currentStep != null && currentStep.getQueue() != null
                        ? currentStep.getQueue().getId() : null)
                .currentQueueName(currentStep != null && currentStep.getQueue() != null
                        ? currentStep.getQueue().getName() : null)
                .steps(stepStates)
                .startedAt(sw.getStartedAt())
                .completedAt(sw.getCompletedAt())
                .build();
    }
}