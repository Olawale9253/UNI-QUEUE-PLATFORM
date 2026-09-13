package com.uniqueeue.dto.response;

import com.uniqueeue.model.Queue;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QueueResponse {

    private Long id;
    private String name;
    private String description;
    private String department;
    private String location;
    private Boolean isActive;
    private LocalTime opensAt;
    private LocalTime closesAt;
    private Integer maxCapacity;
    private Integer averageServiceMinutes;

    private Boolean allowWaitlist;
    private Boolean autoPromoteWaitlist;
    private Integer maxWaitlistSize;

    // Live counts
    private long waitingCount;
    private long waitlistCount;
    private String currentlyServing;
    private int estimatedMinutes;

    private Long universityId;
    private String universityName;

    private Long createdById;
    private String createdByName;

    private int staffCount;
    private List<StaffInfo> staff;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StaffInfo {
        private Long id;
        private String fullName;
        private String email;
    }

    public static QueueResponse from(Queue q) {
        return QueueResponse.builder()
                .id(q.getId())
                .name(q.getName())
                .description(q.getDescription())
                .department(q.getDepartment())
                .location(q.getLocation())
                .isActive(q.getIsActive())
                .opensAt(q.getOpensAt())
                .closesAt(q.getClosesAt())
                .maxCapacity(q.getMaxCapacity())
                .averageServiceMinutes(q.getAverageServiceMinutes())
                .allowWaitlist(q.getAllowWaitlist())
                .autoPromoteWaitlist(q.getAutoPromoteWaitlist())
                .maxWaitlistSize(q.getMaxWaitlistSize())
                .universityId(q.getUniversity() != null ? q.getUniversity().getId() : null)
                .universityName(q.getUniversity() != null ? q.getUniversity().getName() : null)
                .createdById(q.getCreatedBy() != null ? q.getCreatedBy().getId() : null)
                .createdByName(q.getCreatedBy() != null ? q.getCreatedBy().getFullName() : null)
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }
}