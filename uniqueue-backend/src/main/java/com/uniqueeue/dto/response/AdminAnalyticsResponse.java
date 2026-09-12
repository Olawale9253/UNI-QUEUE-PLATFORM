package com.uniqueeue.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminAnalyticsResponse {

    // ---------- overview ----------
    private long totalQueues;
    private long activeQueues;
    private long totalStaff;
    private long ticketsToday;
    private long ticketsAllTime;
    private long waitingNow;
    private double avgWaitMinutes;
    private double avgServiceMinutes;
    private double noShowRate;         // percentage, e.g. 3.5 means 3.5%
    private double avgRating;

    // ---------- breakdowns ----------
    private List<QueueStats> queues;
    private List<StaffPerformance> staff;
    private List<DailyPoint> dailyTrend;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class QueueStats {
        private Long queueId;
        private String queueName;
        private long ticketsToday;
        private long servedToday;
        private long waitingNow;
        private double avgWaitMinutes;
        private double avgServiceMinutes;
        private double noShowRate;
        private double avgRating;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StaffPerformance {
        private Long staffId;
        private String fullName;
        private long ticketsServed;         // in last 7 days
        private double avgServiceMinutes;
        private double avgRating;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DailyPoint {
        private LocalDate date;
        private long joined;
        private long completed;
    }
}