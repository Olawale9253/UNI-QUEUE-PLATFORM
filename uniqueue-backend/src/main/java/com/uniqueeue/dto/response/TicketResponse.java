package com.uniqueeue.dto.response;

import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.model.Ticket;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketResponse {

    private Long id;
    private String ticketNumber;
    private TicketStatus status;
    private Integer position;
    private Integer priority;
    private Integer estimatedMinutesRemaining;
    private Boolean onWaitlist;

    private Long queueId;
    private String queueName;
    private String queueLocation;

    private Long userId;
    private String userFullName;
    private String userEmail;
    private String matricNumber;

    private Long servedById;
    private String servedByName;

    private LocalDateTime joinedAt;
    private LocalDateTime calledAt;
    private LocalDateTime servedAt;
    private LocalDateTime completedAt;

    private String notes;

    public static TicketResponse from(Ticket ticketValue, Integer positionOverride, Integer estimatedMinutes) {
        return TicketResponse.builder()
                .id(ticketValue.getId())
                .ticketNumber(ticketValue.getTicketNumber())
                .status(ticketValue.getStatus())
                .position(positionOverride != null ? positionOverride : ticketValue.getPosition())
                .priority(ticketValue.getPriority())
                .estimatedMinutesRemaining(estimatedMinutes)
                .onWaitlist(ticketValue.getStatus() == TicketStatus.WAITLISTED)
                .queueId(ticketValue.getQueue() != null ? ticketValue.getQueue().getId() : null)
                .queueName(ticketValue.getQueue() != null ? ticketValue.getQueue().getName() : null)
                .queueLocation(ticketValue.getQueue() != null ? ticketValue.getQueue().getLocation() : null)
                .userId(ticketValue.getUser() != null ? ticketValue.getUser().getId() : null)
                .userFullName(ticketValue.getUser() != null ? ticketValue.getUser().getFullName() : null)
                .userEmail(ticketValue.getUser() != null ? ticketValue.getUser().getEmail() : null)
                .matricNumber(ticketValue.getUser() != null ? ticketValue.getUser().getMatricNumber() : null)
                .servedById(ticketValue.getServedBy() != null ? ticketValue.getServedBy().getId() : null)
                .servedByName(ticketValue.getServedBy() != null ? ticketValue.getServedBy().getFullName() : null)
                .joinedAt(ticketValue.getJoinedAt())
                .calledAt(ticketValue.getCalledAt())
                .servedAt(ticketValue.getServedAt())
                .completedAt(ticketValue.getCompletedAt())
                .notes(ticketValue.getNotes())
                .build();
    }

    public static TicketResponse from(Ticket ticketValue2, Integer positionOverride) {
        return from(ticketValue2, positionOverride, null);
    }

    public static TicketResponse from(Ticket ticketValue3) {
        return from(ticketValue3, null, null);
    }
}