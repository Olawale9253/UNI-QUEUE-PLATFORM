package com.uniqueeue.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminAnalyticsResponse {

    // ---------- overview ----------
    private long totalQueues;
    private long activeQueues;
    private long totalStaff;
    private long totalStudents;
    private long ticketsToday;
    private long ticketsAllTime;
    private long waitingNow;

    private double avgWaitMinutes;
    private double avgServiceMinutes;
    private double noShowRate;
    private double avgRating;

    // ---------- week-over-week ----------
    private long ticketsThisWeek;
    private long ticketsLastWeek;
    private long completedThisWeek;
    private long completedLastWeek;
    private long newUsersThisWeek;
    private long newUsersLastWeek;

    // ---------- breakdowns ----------
    private List<QueueStats> queues;
    private List<StaffPerformance> staff;
    private List<DailyPoint> dailyTrend; // 14 days

    /** { students, staff, admins } */
    private Map<String, Long> roleDistribution;

    /** { WAITING, CALLED, SERVING, COMPLETED, NO_SHOW, CANCELLED, TRANSFERRED, WAITLISTED } */
    private Map<String, Long> statusBreakdown;

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
        private long ticketsServed;
        private double avgServiceMinutes;
        private double avgRating;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DailyPoint {
        private LocalDate date;
        private long joined;
        private long completed;
        private long newUsers;
    }
}