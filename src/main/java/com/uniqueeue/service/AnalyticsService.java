package com.uniqueeue.service;

import com.uniqueeue.dto.response.AdminAnalyticsResponse;
import com.uniqueeue.dto.response.AdminAnalyticsResponse.DailyPoint;
import com.uniqueeue.dto.response.AdminAnalyticsResponse.QueueStats;
import com.uniqueeue.dto.response.AdminAnalyticsResponse.StaffPerformance;
import com.uniqueeue.enums.Role;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.FeedbackRepository;
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.TicketRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TicketRepository ticketRepository;
    private final QueueRepository queueRepository;
    private final UserRepository userRepository;
    private final FeedbackRepository feedbackRepository;

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse forUniversity(Long universityId) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime sevenDaysAgo = today.minusDays(6).atStartOfDay();

        // ---------- overview ----------
        List<Queue> queues = queueRepository.findByUniversityId(universityId);
        long activeQueues = queues.stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsActive()))
                .count();

        long totalStaff = userRepository.findByUniversityIdAndRole(universityId, Role.STAFF).size();
        long ticketsToday = ticketRepository.countByUniversitySince(universityId, startOfDay);
        long ticketsAllTime = ticketRepository.countByUniversity(universityId);
        long waitingNow = ticketRepository.countByUniversityAndStatus(universityId, TicketStatus.WAITING);

        List<Ticket> recent = ticketRepository.findRecentByUniversity(universityId, sevenDaysAgo);
        List<Ticket> completed = recent.stream()
                .filter(t -> t.getStatus() == TicketStatus.COMPLETED)
                .toList();

        double avgWait = avgMinutes(completed, Ticket::getJoinedAt, Ticket::getCalledAt);
        double avgService = avgMinutes(completed, Ticket::getServedAt, Ticket::getCompletedAt);

        long noShowCount = recent.stream()
                .filter(t -> t.getStatus() == TicketStatus.NO_SHOW)
                .count();
        long totalResolved = noShowCount + completed.size();
        double noShowRate = totalResolved > 0 ? (noShowCount * 100.0 / totalResolved) : 0;

        Double ratingRaw = feedbackRepository.avgRatingByUniversityId(universityId);
        double avgRating = round1(ratingRaw != null ? ratingRaw : 0);

        // ---------- per-queue ----------
        List<QueueStats> queueStats = new ArrayList<>();
        for (Queue q : queues) {
            List<Ticket> qRecent = ticketRepository.findRecentByQueue(q.getId(), sevenDaysAgo);

            long qToday = qRecent.stream()
                    .filter(t -> t.getJoinedAt() != null && t.getJoinedAt().toLocalDate().equals(today))
                    .count();

            List<Ticket> qCompleted = qRecent.stream()
                    .filter(t -> t.getStatus() == TicketStatus.COMPLETED)
                    .toList();

            long qServedToday = qCompleted.stream()
                    .filter(t -> t.getCompletedAt() != null && t.getCompletedAt().toLocalDate().equals(today))
                    .count();

            long qWaiting = ticketRepository.countByQueueAndStatus(q.getId(), TicketStatus.WAITING);

            double qAvgWait = avgMinutes(qCompleted, Ticket::getJoinedAt, Ticket::getCalledAt);
            double qAvgService = avgMinutes(qCompleted, Ticket::getServedAt, Ticket::getCompletedAt);

            long qNoShows = qRecent.stream()
                    .filter(t -> t.getStatus() == TicketStatus.NO_SHOW)
                    .count();
            long qResolved = qNoShows + qCompleted.size();
            double qNoShowRate = qResolved > 0 ? (qNoShows * 100.0 / qResolved) : 0;

            Double qRatingRaw = feedbackRepository.avgRatingByQueueId(q.getId());

            queueStats.add(QueueStats.builder()
                    .queueId(q.getId())
                    .queueName(q.getName())
                    .ticketsToday(qToday)
                    .servedToday(qServedToday)
                    .waitingNow(qWaiting)
                    .avgWaitMinutes(round1(qAvgWait))
                    .avgServiceMinutes(round1(qAvgService))
                    .noShowRate(round1(qNoShowRate))
                    .avgRating(round1(qRatingRaw != null ? qRatingRaw : 0))
                    .build());
        }

        // ---------- per-staff ----------
        List<User> staff = userRepository.findByUniversityIdAndRole(universityId, Role.STAFF);
        List<StaffPerformance> staffStats = new ArrayList<>();
        for (User s : staff) {
            List<Ticket> sTickets = ticketRepository.findRecentByStaff(s.getId(), sevenDaysAgo);
            List<Ticket> sCompleted = sTickets.stream()
                    .filter(t -> t.getStatus() == TicketStatus.COMPLETED)
                    .toList();

            double sAvgService = avgMinutes(sCompleted, Ticket::getServedAt, Ticket::getCompletedAt);
            Double sRatingRaw = feedbackRepository.avgRatingByStaffId(s.getId());

            staffStats.add(StaffPerformance.builder()
                    .staffId(s.getId())
                    .fullName(s.getFullName())
                    .ticketsServed(sCompleted.size())
                    .avgServiceMinutes(round1(sAvgService))
                    .avgRating(round1(sRatingRaw != null ? sRatingRaw : 0))
                    .build());
        }

        // ---------- daily trend (last 7 days) ----------
        Map<LocalDate, long[]> grouped = new HashMap<>();  // date -> [joined, completed]
        for (Ticket t : recent) {
            if (t.getJoinedAt() != null) {
                grouped.computeIfAbsent(t.getJoinedAt().toLocalDate(), k -> new long[2])[0]++;
            }
            if (t.getCompletedAt() != null) {
                grouped.computeIfAbsent(t.getCompletedAt().toLocalDate(), k -> new long[2])[1]++;
            }
        }

        List<DailyPoint> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            long[] counts = grouped.getOrDefault(d, new long[2]);
            trend.add(DailyPoint.builder()
                    .date(d)
                    .joined(counts[0])
                    .completed(counts[1])
                    .build());
        }

        return AdminAnalyticsResponse.builder()
                .totalQueues(queues.size())
                .activeQueues(activeQueues)
                .totalStaff(totalStaff)
                .ticketsToday(ticketsToday)
                .ticketsAllTime(ticketsAllTime)
                .waitingNow(waitingNow)
                .avgWaitMinutes(round1(avgWait))
                .avgServiceMinutes(round1(avgService))
                .noShowRate(round1(noShowRate))
                .avgRating(avgRating)
                .queues(queueStats)
                .staff(staffStats)
                .dailyTrend(trend)
                .build();
    }

    // ---------- helpers ----------

    private double avgMinutes(List<Ticket> tickets,
                              java.util.function.Function<Ticket, LocalDateTime> start,
                              java.util.function.Function<Ticket, LocalDateTime> end) {
        return tickets.stream()
                .filter(t -> start.apply(t) != null && end.apply(t) != null)
                .mapToLong(t -> Duration.between(start.apply(t), end.apply(t)).toMinutes())
                .average()
                .orElse(0);
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}