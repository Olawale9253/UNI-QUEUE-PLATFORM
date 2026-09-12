package com.uniqueeue.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemAnalyticsResponse {

    private long totalUniversities;
    private long activeUniversities;
    private long totalUsers;
    private long totalStaff;
    private long totalAdmins;
    private long totalQueues;
    private long activeQueues;
    private long ticketsToday;
    private long ticketsAllTime;
    private long waitingNow;
    private double avgWaitMinutes;
    private double avgServiceMinutes;

    private List<UniversitySummary> universities;
    private List<DailyPoint> dailyTrend;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UniversitySummary {
        private Long universityId;
        private String name;
        private String code;
        private boolean isActive;
        private long users;
        private long staff;
        private long queues;
        private long ticketsToday;
        private long ticketsAllTime;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DailyPoint {
        private LocalDate date;
        private long joined;
        private long completed;
    }
}