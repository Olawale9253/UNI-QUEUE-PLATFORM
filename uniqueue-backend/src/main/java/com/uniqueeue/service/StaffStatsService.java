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
                .filter(t -> t.getStatus() == TicketStatus.CALLED
                        || t.getStatus() == TicketStatus.SERVING)
                .findFirst();

        List<Ticket> completed = all.stream()
                .filter(t -> t.getStatus() == TicketStatus.COMPLETED)
                .toList();

        LocalDate today = LocalDate.now();
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);

        long servedToday = completed.stream()
                .filter(t -> t.getCompletedAt() != null
                        && today.equals(t.getCompletedAt().toLocalDate()))
                .count();

        long servedThisWeek = completed.stream()
                .filter(t -> t.getCompletedAt() != null
                        && t.getCompletedAt().isAfter(weekAgo))
                .count();

        long servedAllTime = completed.size();

        long avgService = 0;
        if (!completed.isEmpty()) {
            long totalMinutes = 0;
            int counted = 0;
            for (Ticket t : completed) {
                if (t.getServedAt() != null && t.getCompletedAt() != null) {
                    totalMinutes += Duration.between(t.getServedAt(), t.getCompletedAt()).toMinutes();
                    counted++;
                } else if (t.getJoinedAt() != null && t.getCompletedAt() != null) {
                    totalMinutes += Duration.between(t.getJoinedAt(), t.getCompletedAt()).toMinutes();
                    counted++;
                }
            }
            if (counted > 0) avgService = totalMinutes / counted;
        }

        StaffStatsResponse.StaffStatsResponseBuilder b = StaffStatsResponse.builder()
                .servedToday(servedToday)
                .servedThisWeek(servedThisWeek)
                .servedAllTime(servedAllTime)
                .avgServiceMinutes(avgService);

        active.ifPresent(t -> {
            b.currentlyServing(t.getTicketNumber());
            b.currentlyServingQueue(t.getQueue() != null ? t.getQueue().getName() : null);
        });

        return b.build();
    }
}