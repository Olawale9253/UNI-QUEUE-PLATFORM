package com.uniqueeue.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserStatsResponse {

    private boolean hasActiveTicket;
    private String activeTicketNumber;
    private String activeQueueName;
    private int activePosition;
    private long todayJoined;
    private long thisWeekCompleted;
    private long totalCompleted;
    private long avgWaitMinutes;
}