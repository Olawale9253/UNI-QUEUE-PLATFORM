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

    /** Office this service belongs to. */
    private Long officeId;
    private String officeName;
    private String officeLocation;
    private String officeIcon;

    /** Deprecated — mirrors officeName for backward compatibility. */
    @Deprecated
    private String department;

    private String subDepartment;
    private String location;
    private Boolean isActive;
    private LocalTime opensAt;
    private LocalTime closesAt;
    private Integer maxCapacity;
    private Integer averageServiceMinutes;

    private Boolean allowWaitlist;
    private Boolean autoPromoteWaitlist;
    private Integer maxWaitlistSize;
    private Boolean matricRequired;

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

    // ─────────────────────────────────────────────────────────────
    //  Schedule (set by QueueService via QueueScheduleService)
    // ─────────────────────────────────────────────────────────────

    /**
     * True if the queue is currently accepting joins.
     * Null until the caller enriches the response — see QueueService.enrichWithStaff().
     */
    private Boolean isOpen;

    /**
     * CSV of ISO day numbers when this queue operates.
     * 1=Mon .. 7=Sun. Empty = every day. Default = "1,2,3,4,5".
     */
    private String operatingDays;

    // ─────────────────────────────────────────────────────────────
    //  Nested DTO
    // ─────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StaffInfo {
        private Long id;
        private String fullName;
        private String email;
    }

    // ─────────────────────────────────────────────────────────────
    //  Factory
    // ─────────────────────────────────────────────────────────────

    public static QueueResponse from(Queue queue) {
        String officeName = queue.getOffice() != null ? queue.getOffice().getName() : queue.getDepartment();
        String officeLocation = queue.getOffice() != null ? queue.getOffice().getLocation() : null;
        String officeIcon = queue.getOffice() != null ? queue.getOffice().getIcon() : null;

        return QueueResponse.builder()
                .id(queue.getId())
                .name(queue.getName())
                .description(queue.getDescription())
                .officeId(queue.getOffice() != null ? queue.getOffice().getId() : null)
                .officeName(officeName)
                .officeLocation(officeLocation)
                .officeIcon(officeIcon)
                .department(officeName)
                .subDepartment(queue.getSubDepartment())
                .location(queue.getLocation())
                .isActive(queue.getIsActive())
                .opensAt(queue.getOpensAt())
                .closesAt(queue.getClosesAt())
                .maxCapacity(queue.getMaxCapacity())
                .averageServiceMinutes(queue.getAverageServiceMinutes())
                .allowWaitlist(queue.getAllowWaitlist())
                .autoPromoteWaitlist(queue.getAutoPromoteWaitlist())
                .maxWaitlistSize(queue.getMaxWaitlistSize())
                .matricRequired(queue.getMatricRequired() != null ? queue.getMatricRequired() : false)
                .universityId(queue.getUniversity() != null ? queue.getUniversity().getId() : null)
                .universityName(queue.getUniversity() != null ? queue.getUniversity().getName() : null)
                .createdById(queue.getCreatedBy() != null ? queue.getCreatedBy().getId() : null)
                .createdByName(queue.getCreatedBy() != null ? queue.getCreatedBy().getFullName() : null)
                .createdAt(queue.getCreatedAt())
                .updatedAt(queue.getUpdatedAt())
                .operatingDays(queue.getOperatingDays())          // ⬅ NEW
                // isOpen intentionally left null — set by QueueService
                .build();
    }

    /**
     * Fluent setter so QueueService can chain:
     *   QueueResponse.from(queue).withIsOpen(scheduleService.isWithinOperatingHours(queue))
     */
    public QueueResponse withIsOpen(boolean open) {
        this.isOpen = open;
        return this;
    }
}