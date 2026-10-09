package com.uniqueeue.dto.response;

import com.uniqueeue.enums.StepStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkflowProgressResponse {

    /* ---------- shared ---------- */
    private Long id;                 // getProgress
    private Long enrollmentId;       // getMyProgress
    private Long workflowId;         // getMyProgress
    private String workflowName;
    private String description;
    private String session;
    private String status;           // "IN_PROGRESS" / "COMPLETED" / "ABANDONED"
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer currentStepOrder;
    private Integer totalSteps;
    private Integer completedSteps;
    private Integer progressPercent; // getMyProgress

    /* ---------- getMyProgress convenience ---------- */
    private NextAction nextAction;

    /* ---------- getProgress convenience ---------- */
    private Long currentQueueId;
    private String currentQueueName;
    private String currentStepLabel;
    private String currentStepInstructions;

    /* ---------- step lists (two shapes, two fields) ---------- */
    private List<StepProgress> steps;          // Phase A
    private List<ProgressStep> progressSteps;  // legacy

    /* ============================================================
       Phase A shape
       ============================================================ */

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StepProgress {
        private Integer order;
        private Long queueId;
        private String queueName;
        private String officeName;
        private String label;
        private StepStatus status;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private Boolean isCurrent;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NextAction {
        private Long queueId;
        private String queueName;
        private String officeName;
        private String label;
    }

    /* ============================================================
       Legacy shape (used by getProgress)
       ============================================================ */

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProgressStep {
        private Integer order;
        private Long queueId;
        private String queueName;
        private String label;
        private String instructions;
        private Boolean isRequired;
        private String state;   // COMPLETED | CURRENT | LOCKED
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private String completedByName;
        private Long ticketId;
        private String notes;
    }
}