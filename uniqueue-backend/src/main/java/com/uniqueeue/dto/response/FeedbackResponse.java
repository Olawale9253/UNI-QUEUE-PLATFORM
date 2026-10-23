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

    // 🔧 NEW: Added missing fields for the frontend
    private String studentName;
    private String universityName;
    private String universityCode;
    private String queueName;

    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public static FeedbackResponse from(Feedback feedback) {
        if (feedback == null) return null;

        // Safely extract user and university details
        String fullName = feedback.getUser() != null ? feedback.getUser().getFullName() : null;
        String uName = null;
        String uCode = null;

        if (feedback.getUser() != null && feedback.getUser().getUniversity() != null) {
            uName = feedback.getUser().getUniversity().getName();
            uCode = feedback.getUser().getUniversity().getCode();
        }

        // Safely extract queue name
        String qName = null;
        if (feedback.getTicket() != null && feedback.getTicket().getQueue() != null) {
            qName = feedback.getTicket().getQueue().getName();
        }

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .ticketId(feedback.getTicket() != null ? feedback.getTicket().getId() : null)
                .ticketNumber(feedback.getTicket() != null ? feedback.getTicket().getTicketNumber() : null)
                .userId(feedback.getUser() != null ? feedback.getUser().getId() : null)
                .userFullName(fullName)

                // 🔧 Map the new fields
                .studentName(fullName != null ? fullName : "Anonymous Student")
                .universityName(uName)
                .universityCode(uCode)
                .queueName(qName)

                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .createdAt(feedback.getCreatedAt())
                .build();
    }
}