package com.uniqueeue.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StaffStatsResponse {

    private String currentlyServing;
    private String currentlyServingQueue;
    private long servedToday;
    private long servedThisWeek;
    private long servedAllTime;
    private long avgServiceMinutes;
}