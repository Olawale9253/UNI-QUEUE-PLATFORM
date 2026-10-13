package com.uniqueeue.service;

import com.uniqueeue.dto.response.StaffStatsResponse;
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
public class StaffStatsService {

    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public StaffStatsResponse stats(Long staffId) {
        List<Ticket> all = ticketRepository.findByServedById(staffId);

        Optional<Ticket> active = all.stream()
                .filter(ticketValue17 -> ticketValue17.getStatus() == TicketStatus.CALLED
                        || ticketValue17.getStatus() == TicketStatus.SERVING)
                .findFirst();

        List<Ticket> completed = all.stream()
                .filter(ticketValue18 -> ticketValue18.getStatus() == TicketStatus.COMPLETED)
                .toList();

        LocalDate today = LocalDate.now();
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);

        long servedToday = completed.stream()
                .filter(ticketValue19 -> ticketValue19.getCompletedAt() != null
                        && today.equals(ticketValue19.getCompletedAt().toLocalDate()))
                .count();

        long servedThisWeek = completed.stream()
                .filter(ticketValue20 -> ticketValue20.getCompletedAt() != null
                        && ticketValue20.getCompletedAt().isAfter(weekAgo))
                .count();

        long servedAllTime = completed.size();

        long avgService = 0;
        if (!completed.isEmpty()) {
            long totalMinutes = 0;
            int counted = 0;
            for (Ticket ticketValue21 : completed) {
                if (ticketValue21.getServedAt() != null && ticketValue21.getCompletedAt() != null) {
                    totalMinutes += Duration.between(ticketValue21.getServedAt(), ticketValue21.getCompletedAt()).toMinutes();
                    counted++;
                } else if (ticketValue21.getJoinedAt() != null && ticketValue21.getCompletedAt() != null) {
                    totalMinutes += Duration.between(ticketValue21.getJoinedAt(), ticketValue21.getCompletedAt()).toMinutes();
                    counted++;
                }
            }
            if (counted > 0) avgService = totalMinutes / counted;
        }

        StaffStatsResponse.StaffStatsResponseBuilder staffStatsResponseBuilder = StaffStatsResponse.builder()
                .servedToday(servedToday)
                .servedThisWeek(servedThisWeek)
                .servedAllTime(servedAllTime)
                .avgServiceMinutes(avgService);

        active.ifPresent(ticketValue22 -> {
            staffStatsResponseBuilder.currentlyServing(ticketValue22.getTicketNumber());
            staffStatsResponseBuilder.currentlyServingQueue(ticketValue22.getQueue() != null ? ticketValue22.getQueue().getName() : null);
        });

        return staffStatsResponseBuilder.build();
    }
}