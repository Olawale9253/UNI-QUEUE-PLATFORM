package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateFeedbackRequest;
import com.uniqueeue.dto.response.FeedbackResponse;
import com.uniqueeue.dto.response.StaffFeedbackSummaryResponse;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    // ─── NEW: Staff personal feedback summary (anonymized) ───────────────

    @Transactional(readOnly = true)
    public StaffFeedbackSummaryResponse getStaffSummary(Long staffId) {
        List<Feedback> all = feedbackRepository.findByServedById(staffId);

        if (all.isEmpty()) {
            return StaffFeedbackSummaryResponse.builder()
                    .avgRating(0.0)
                    .totalRatings(0L)
                    .thisMonthAvg(0.0)
                    .thisMonthCount(0L)
                    .lastMonthAvg(0.0)
                    .positivePercent(0)
                    .perQueue(List.of())
                    .recentComments(List.of())
                    .build();
        }

        long totalRatings = all.size();
        double avgRating = all.stream()
                .mapToInt(Feedback::getRating)
                .average()
                .orElse(0);

        // Time windows
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfThisMonth = now.withDayOfMonth(1)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);
        LocalDateTime endOfLastMonth = startOfThisMonth.minusSeconds(1);

        List<Feedback> thisMonth = all.stream()
                .filter(f -> f.getCreatedAt() != null && !f.getCreatedAt().isBefore(startOfThisMonth))
                .toList();
        List<Feedback> lastMonth = all.stream()
                .filter(f -> f.getCreatedAt() != null
                        && !f.getCreatedAt().isBefore(startOfLastMonth)
                        && f.getCreatedAt().isBefore(endOfLastMonth))
                .toList();

        double thisMonthAvg = thisMonth.stream().mapToInt(Feedback::getRating).average().orElse(0);
        double lastMonthAvg = lastMonth.stream().mapToInt(Feedback::getRating).average().orElse(0);

        long positives = all.stream().filter(f -> f.getRating() >= 4).count();
        int positivePercent = (int) Math.round((positives * 100.0) / totalRatings);

        // Per-queue breakdown
        Map<Long, List<Feedback>> byQueue = all.stream()
                .filter(f -> f.getTicket() != null && f.getTicket().getQueue() != null)
                .collect(Collectors.groupingBy(f -> f.getTicket().getQueue().getId()));

        List<StaffFeedbackSummaryResponse.PerQueue> perQueue = byQueue.entrySet().stream()
                .map(entry -> {
                    List<Feedback> group = entry.getValue();
                    Feedback first = group.get(0);
                    Ticket ticket = first.getTicket();
                    String officeName = ticket.getQueue().getOffice() != null
                            ? ticket.getQueue().getOffice().getName()
                            : null;
                    double groupAvg = group.stream().mapToInt(Feedback::getRating).average().orElse(0);
                    return StaffFeedbackSummaryResponse.PerQueue.builder()
                            .queueId(entry.getKey())
                            .queueName(ticket.getQueue().getName())
                            .officeName(officeName)
                            .avgRating(round1(groupAvg))
                            .totalRatings((long) group.size())
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getTotalRatings(), a.getTotalRatings()))
                .toList();

        // Recent comments (last 10, no student identity exposed)
        List<StaffFeedbackSummaryResponse.RecentComment> recentComments = all.stream()
                .filter(f -> f.getComment() != null && !f.getComment().isBlank())
                .filter(f -> f.getCreatedAt() != null)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(10)
                .map(f -> StaffFeedbackSummaryResponse.RecentComment.builder()
                        .id(f.getId())
                        .rating(f.getRating())
                        .comment(f.getComment())
                        .createdAt(f.getCreatedAt())
                        .build())
                .toList();

        return StaffFeedbackSummaryResponse.builder()
                .avgRating(round1(avgRating))
                .totalRatings(totalRatings)
                .thisMonthAvg(round1(thisMonthAvg))
                .thisMonthCount((long) thisMonth.size())
                .lastMonthAvg(round1(lastMonthAvg))
                .positivePercent(positivePercent)
                .perQueue(perQueue)
                .recentComments(recentComments)
                .build();
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}