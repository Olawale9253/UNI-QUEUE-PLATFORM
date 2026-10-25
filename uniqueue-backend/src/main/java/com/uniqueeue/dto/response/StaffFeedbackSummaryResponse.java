package com.uniqueeue.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StaffFeedbackSummaryResponse {
    private Double avgRating;
    private Long totalRatings;
    private Double thisMonthAvg;
    private Long thisMonthCount;
    private Double lastMonthAvg;
    private Integer positivePercent;
    private List<PerQueue> perQueue;
    private List<RecentComment> recentComments;

    @Data
    @Builder
    public static class PerQueue {
        private Long queueId;
        private String queueName;
        private String officeName;
        private Double avgRating;
        private Long totalRatings;
    }

    @Data
    @Builder
    public static class RecentComment {
        private Long id;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }
}