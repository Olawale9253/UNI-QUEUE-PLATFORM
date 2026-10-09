package com.uniqueeue.dto.response;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkflowAnalyticsResponse {

    private Long workflowId;
    private String workflowName;
    private String session;

    private Long totalEnrolled;
    private Long totalCompleted;
    private Long totalInProgress;
    private Long totalAbandoned;

    private Double avgCompletionDays;
    private Integer totalSteps;

    private List<StepAnalytics> steps;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StepAnalytics {
        private Integer order;
        private Long queueId;
        private String queueName;
        private String label;

        private Long completedCount;      // students who've passed this step
        private Long currentlyOnCount;    // students currently stuck on this step
        private Long pendingCount;        // students who haven't reached it yet

        private Double avgHoursOnStep;    // how long it takes, on average
        private Boolean isBottleneck;
    }
}