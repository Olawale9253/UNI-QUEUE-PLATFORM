package com.uniqueeue.service;

import com.uniqueeue.dto.response.UserStatsResponse;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserStatsService {

    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public UserStatsResponse stats(Long userId) {
        List<Ticket> all = ticketRepository.findByUserIdOrderByJoinedAtDesc(userId);

        Optional<Ticket> active = all.stream()
                .filter(t -> t.getStatus() == TicketStatus.WAITING
                        || t.getStatus() == TicketStatus.CALLED
                        || t.getStatus() == TicketStatus.SERVING)
                .findFirst();

        LocalDate today = LocalDate.now();
        long todayJoined = all.stream()
                .filter(t -> today.equals(t.getTicketDate()))
                .count();

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long thisWeekCompleted = all.stream()
                .filter(t -> t.getStatus() == TicketStatus.COMPLETED)
                .filter(t -> t.getJoinedAt() != null && t.getJoinedAt().isAfter(weekAgo))
                .count();

        List<Ticket> completed = all.stream()
                .filter(t -> t.getStatus() == TicketStatus.COMPLETED)
                .toList();

        long totalCompleted = completed.size();

        long avgWait = 0;
        if (!completed.isEmpty()) {
            long totalMinutes = 0;
            int counted = 0;
            for (Ticket t : completed) {
                if (t.getJoinedAt() != null && t.getCompletedAt() != null) {
                    totalMinutes += Duration.between(t.getJoinedAt(), t.getCompletedAt()).toMinutes();
                    counted++;
                }
            }
            if (counted > 0) avgWait = totalMinutes / counted;
        }

        UserStatsResponse.UserStatsResponseBuilder b = UserStatsResponse.builder()
                .hasActiveTicket(active.isPresent())
                .todayJoined(todayJoined)
                .thisWeekCompleted(thisWeekCompleted)
                .totalCompleted(totalCompleted)
                .avgWaitMinutes(avgWait);

        active.ifPresent(t -> {
            b.activeTicketNumber(t.getTicketNumber());
            b.activeQueueName(t.getQueue() != null ? t.getQueue().getName() : null);
        });

        return b.build();
    }
}