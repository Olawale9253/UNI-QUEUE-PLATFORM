package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateFeedbackRequest;
import com.uniqueeue.dto.response.FeedbackResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Feedback;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.repository.FeedbackRepository;
import com.uniqueeue.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final TicketRepository ticketRepository;
    private final AuditService auditService;

    @Transactional
    public FeedbackResponse submit(Long userId, CreateFeedbackRequest request) {
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Only the ticket's owner can rate it.
        if (!ticket.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Ticket not found");
        }
        if (ticket.getStatus() != TicketStatus.COMPLETED) {
            throw new BadRequestException("You can only rate completed tickets");
        }
        if (feedbackRepository.existsByTicketId(ticket.getId())) {
            throw new BadRequestException("You've already submitted feedback for this ticket");
        }

        Feedback feedback = Feedback.builder()
                .ticket(ticket)
                .user(ticket.getUser())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Feedback saved = feedbackRepository.save(feedback);

        auditService.record(userId, ticket.getQueue().getUniversity().getId(),
                AuditAction.FEEDBACK_SUBMITTED, "Feedback", saved.getId(),
                "{\"rating\":" + request.getRating() + ",\"ticketId\":" + ticket.getId() + "}");

        return FeedbackResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> listForUniversity(Long universityId) {
        return feedbackRepository.findByUniversityId(universityId).stream()
                .map(FeedbackResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> listForStaff(Long staffId) {
        return feedbackRepository.findByServedById(staffId).stream()
                .map(FeedbackResponse::from).toList();
    }

    // Super Admin fetches all feedback across the platform
    @Transactional(readOnly = true)
    public List<FeedbackResponse> listAll() {
        return feedbackRepository.findAll().stream()
                .map(FeedbackResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Double avgRatingForUniversity(Long universityId) {
        Double avg = feedbackRepository.avgRatingByUniversityId(universityId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }
}