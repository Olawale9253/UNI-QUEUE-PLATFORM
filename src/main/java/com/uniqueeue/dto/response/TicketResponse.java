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

    public static TicketResponse from(Ticket t, Integer positionOverride) {
        return TicketResponse.builder()
                .id(t.getId())
                .ticketNumber(t.getTicketNumber())
                .status(t.getStatus())
                .position(positionOverride != null ? positionOverride : t.getPosition())
                .priority(t.getPriority())
                .queueId(t.getQueue() != null ? t.getQueue().getId() : null)
                .queueName(t.getQueue() != null ? t.getQueue().getName() : null)
                .queueLocation(t.getQueue() != null ? t.getQueue().getLocation() : null)
                .userId(t.getUser() != null ? t.getUser().getId() : null)
                .userFullName(t.getUser() != null ? t.getUser().getFullName() : null)
                .userEmail(t.getUser() != null ? t.getUser().getEmail() : null)
                .matricNumber(t.getUser() != null ? t.getUser().getMatricNumber() : null)
                .servedById(t.getServedBy() != null ? t.getServedBy().getId() : null)
                .servedByName(t.getServedBy() != null ? t.getServedBy().getFullName() : null)
                .joinedAt(t.getJoinedAt())
                .calledAt(t.getCalledAt())
                .servedAt(t.getServedAt())
                .completedAt(t.getCompletedAt())
                .notes(t.getNotes())
                .build();
    }

    public static TicketResponse from(Ticket t) {
        return from(t, null);
    }
}