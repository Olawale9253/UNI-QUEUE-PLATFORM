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
                .filter(ticketValue32 -> ticketValue32.getStatus() == TicketStatus.WAITING
                        || ticketValue32.getStatus() == TicketStatus.CALLED
                        || ticketValue32.getStatus() == TicketStatus.SERVING)
                .findFirst();

        LocalDate today = LocalDate.now();
        long todayJoined = all.stream()
                .filter(ticketValue33 -> today.equals(ticketValue33.getTicketDate()))
                .count();

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long thisWeekCompleted = all.stream()
                .filter(ticketValue34 -> ticketValue34.getStatus() == TicketStatus.COMPLETED)
                .filter(ticketValue35 -> ticketValue35.getJoinedAt() != null && ticketValue35.getJoinedAt().isAfter(weekAgo))
                .count();

        List<Ticket> completed = all.stream()
                .filter(ticketValue36 -> ticketValue36.getStatus() == TicketStatus.COMPLETED)
                .toList();

        long totalCompleted = completed.size();

        long avgWait = 0;
        if (!completed.isEmpty()) {
            long totalMinutes = 0;
            int counted = 0;
            for (Ticket ticketValue37 : completed) {
                if (ticketValue37.getJoinedAt() != null && ticketValue37.getCompletedAt() != null) {
                    totalMinutes += Duration.between(ticketValue37.getJoinedAt(), ticketValue37.getCompletedAt()).toMinutes();
                    counted++;
                }
            }
            if (counted > 0) avgWait = totalMinutes / counted;
        }

        UserStatsResponse.UserStatsResponseBuilder userStatsResponseBuilder = UserStatsResponse.builder()
                .hasActiveTicket(active.isPresent())
                .todayJoined(todayJoined)
                .thisWeekCompleted(thisWeekCompleted)
                .totalCompleted(totalCompleted)
                .avgWaitMinutes(avgWait);

        active.ifPresent(ticketValue38 -> {
            userStatsResponseBuilder.activeTicketNumber(ticketValue38.getTicketNumber());
            userStatsResponseBuilder.activeQueueName(ticketValue38.getQueue() != null ? ticketValue38.getQueue().getName() : null);
        });

        return userStatsResponseBuilder.build();
    }
}