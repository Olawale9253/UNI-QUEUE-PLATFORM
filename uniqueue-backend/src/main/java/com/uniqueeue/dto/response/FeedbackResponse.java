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

    public static FeedbackResponse from(Feedback feedback) {
        return FeedbackResponse.builder()
                .id(feedback.getId())
                .ticketId(feedback.getTicket() != null ? feedback.getTicket().getId() : null)
                .ticketNumber(feedback.getTicket() != null ? feedback.getTicket().getTicketNumber() : null)
                .userId(feedback.getUser() != null ? feedback.getUser().getId() : null)
                .userFullName(feedback.getUser() != null ? feedback.getUser().getFullName() : null)
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .createdAt(feedback.getCreatedAt())
                .build();
    }
}