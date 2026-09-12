package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QueueEstimateResponse {

    private Long queueId;
    private String queueName;

    @JsonProperty("isOpen")
    private boolean isOpen;

    private String opensAt;
    private String closesAt;

    private long waitingCount;
    private long waitlistCount;
    private long activeCalledCount;
    private String currentlyServing;

    private boolean allowWaitlist;

    @JsonProperty("isFull")
    private boolean isFull;

    private int configuredAvgMinutes;
    private double actualAvgMinutesToday;
    private int estimatedMinutesForNewJoiner;
    private int estimatedMinutesForWaitlisters;
}