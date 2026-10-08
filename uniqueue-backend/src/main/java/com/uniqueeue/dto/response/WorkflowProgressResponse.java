package com.uniqueeue.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rich view of a student's progress through a workflow.
 * Drives the "My Clearance" page and the dashboard card.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkflowProgressResponse {

    private Long id;                       // StudentWorkflow id
    private String workflowName;
    private String description;
    private String session;
    private String status;                 // IN_PROGRESS | COMPLETED | ABANDONED
    private Integer currentStepOrder;
    private Integer totalSteps;
    private Integer completedSteps;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    // Convenience for the current step — so the card can render a "Join Queue" button
    private Long currentQueueId;
    private String currentQueueName;
    private String currentStepLabel;
    private String currentStepInstructions;

    private List<ProgressStep> steps;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProgressStep {
        private Integer order;
        private Long queueId;
        private String queueName;
        private String label;
        private String instructions;
        private Boolean isRequired;
        private String state;              // COMPLETED | CURRENT | LOCKED
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private String completedByName;    // Staff who served the ticket
        private Long ticketId;
        private String notes;
    }
}