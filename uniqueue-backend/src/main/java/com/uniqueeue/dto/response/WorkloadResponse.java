package com.uniqueeue.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkloadResponse {

    private Long universityId;
    private LocalDateTime generatedAt;

    private Summary summary;
    private List<OfficeLoad> offices;

    /* ============================================================ */

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private Long totalWaiting;
        private Long totalStaff;      // sum of staff-queue assignments (not unique users)
        private Long totalQueues;
        private Long totalOffices;
        private String worstOfficeName;
        private Long worstOfficeWaiting;
        private String overallLevel;  // LOW | MEDIUM | HIGH | CRITICAL
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OfficeLoad {
        private Long officeId;
        private String officeName;
        private Integer queueCount;
        private Long waitingCount;
        private Long staffCount;
        private Double ratio;
        private Integer estWaitMinutes;
        private String level;
        private List<QueueLoad> queues;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class QueueLoad {
        private Long queueId;
        private String queueName;
        private Long waitingCount;
        private Long staffCount;
        private Double ratio;
        private Integer avgServiceMinutes;
        private Integer estWaitMinutes;
        private Boolean isOpen;
        private String level;
    }
}