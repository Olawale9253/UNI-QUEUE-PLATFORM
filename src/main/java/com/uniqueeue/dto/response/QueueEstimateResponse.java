package com.uniqueeue.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QueueEstimateResponse {

    private Long queueId;
    private String queueName;
    private boolean isOpen;
    private String opensAt;
    private String closesAt;

    private long waitingCount;
    private long activeCalledCount;         // 0 or 1
    private String currentlyServing;        // ticket number or null

    private int configuredAvgMinutes;       // from Queue entity
    private double actualAvgMinutesToday;   // measured from today's completed
    private int estimatedMinutesForNewJoiner;
}