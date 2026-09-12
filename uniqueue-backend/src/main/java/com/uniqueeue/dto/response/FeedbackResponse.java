package com.uniqueeue.dto.response;

import com.uniqueeue.model.Feedback;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeedbackResponse {

    private Long id;
    private Long ticketId;
    private String ticketNumber;
    private Long userId;
    private String userFullName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public static FeedbackResponse from(Feedback f) {
        return FeedbackResponse.builder()
                .id(f.getId())
                .ticketId(f.getTicket() != null ? f.getTicket().getId() : null)
                .ticketNumber(f.getTicket() != null ? f.getTicket().getTicketNumber() : null)
                .userId(f.getUser() != null ? f.getUser().getId() : null)
                .userFullName(f.getUser() != null ? f.getUser().getFullName() : null)
                .rating(f.getRating())
                .comment(f.getComment())
                .createdAt(f.getCreatedAt())
                .build();
    }
}