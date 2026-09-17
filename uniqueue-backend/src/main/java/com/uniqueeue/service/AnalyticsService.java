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
import java.util.LinkedHashMap;
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
        LocalDateTime fourteenDaysAgo = today.minusDays(13).atStartOfDay();
        LocalDateTime sevenDaysAgo = today.minusDays(6).atStartOfDay();
        LocalDateTime fourteenDaysAgoStart = today.minusDays(13).atStartOfDay();

        // ───────── overview ─────────
        List<Queue> queues = queueRepository.findByUniversityId(universityId);
        long activeQueues = queues.stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsActive()))
                .count();

        List<User> allUsersOfUniversity = userRepository.findByUniversityId(universityId);
        long totalStaff = allUsersOfUniversity.stream().filter(u -> u.getRole() == Role.STAFF).count();
        long totalStudents = allUsersOfUniversity.stream().filter(u -> u.getRole() == Role.USER).count();
        long totalAdmins = allUsersOfUniversity.stream().filter(u -> u.getRole() == Role.ADMIN).count();

        long ticketsToday = ticketRepository.countByUniversitySince(universityId, startOfDay);
        long ticketsAllTime = ticketRepository.countByUniversity(universityId);
        long waitingNow = ticketRepository.countByUniversityAndStatus(universityId, TicketStatus.WAITING);

        List<Ticket> recent = ticketRepository.findRecentByUniversity(universityId, fourteenDaysAgo);
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

        // ───────── week-over-week ─────────
        long ticketsThisWeek = 0, ticketsLastWeek = 0;
        long completedThisWeek = 0, completedLastWeek = 0;
        for (Ticket t : recent) {
            if (t.getJoinedAt() != null) {
                if (!t.getJoinedAt().isBefore(sevenDaysAgo)) ticketsThisWeek++;
                else if (!t.getJoinedAt().isBefore(fourteenDaysAgoStart)) ticketsLastWeek++;
            }
            if (t.getStatus() == TicketStatus.COMPLETED && t.getCompletedAt() != null) {
                if (!t.getCompletedAt().isBefore(sevenDaysAgo)) completedThisWeek++;
                else if (!t.getCompletedAt().isBefore(fourteenDaysAgoStart)) completedLastWeek++;
            }
        }

        long newUsersThisWeek = 0, newUsersLastWeek = 0;
        Map<LocalDate, long[]> daily = new HashMap<>();
        for (int i = 13; i >= 0; i--) daily.put(today.minusDays(i), new long[3]);

        for (User u : allUsersOfUniversity) {
            if (u.getCreatedAt() == null) continue;
            LocalDate d = u.getCreatedAt().toLocalDate();
            long[] bucket = daily.get(d);
            if (bucket != null) bucket[2]++;

            if (!u.getCreatedAt().isBefore(sevenDaysAgo)) newUsersThisWeek++;
            else if (!u.getCreatedAt().isBefore(fourteenDaysAgoStart)) newUsersLastWeek++;
        }

        for (Ticket t : recent) {
            if (t.getJoinedAt() != null) {
                long[] bucket = daily.get(t.getJoinedAt().toLocalDate());
                if (bucket != null) bucket[0]++;
            }
            if (t.getCompletedAt() != null) {
                long[] bucket = daily.get(t.getCompletedAt().toLocalDate());
                if (bucket != null) bucket[1]++;
            }
        }

        // ───────── per-queue ─────────
        List<QueueStats> queueStats = new ArrayList<>();
        for (Queue q : queues) {
            List<Ticket> qRecent = ticketRepository.findRecentByQueue(q.getId(), fourteenDaysAgo);

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

            long qNoShows = qRecent.stream().filter(t -> t.getStatus() == TicketStatus.NO_SHOW).count();
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

        // ───────── per-staff ─────────
        List<User> staff = userRepository.findByUniversityIdAndRole(universityId, Role.STAFF);
        List<StaffPerformance> staffStats = new ArrayList<>();
        for (User s : staff) {
            List<Ticket> sTickets = ticketRepository.findRecentByStaff(s.getId(), fourteenDaysAgo);
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

        // ───────── daily trend (14 days) ─────────
        List<DailyPoint> trend = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            long[] c = daily.getOrDefault(d, new long[3]);
            trend.add(DailyPoint.builder()
                    .date(d)
                    .joined(c[0])
                    .completed(c[1])
                    .newUsers(c[2])
                    .build());
        }

        // ───────── role distribution ─────────
        Map<String, Long> roleDist = new LinkedHashMap<>();
        roleDist.put("Students", totalStudents);
        roleDist.put("Staff", totalStaff);
        roleDist.put("Admins", totalAdmins);

        // ───────── ticket status breakdown (last 14 days) ─────────
        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        for (TicketStatus status : TicketStatus.values()) {
            long count = recent.stream().filter(t -> t.getStatus() == status).count();
            statusBreakdown.put(status.name(), count);
        }

        return AdminAnalyticsResponse.builder()
                .totalQueues(queues.size())
                .activeQueues(activeQueues)
                .totalStaff(totalStaff)
                .totalStudents(totalStudents)
                .ticketsToday(ticketsToday)
                .ticketsAllTime(ticketsAllTime)
                .waitingNow(waitingNow)
                .avgWaitMinutes(round1(avgWait))
                .avgServiceMinutes(round1(avgService))
                .noShowRate(round1(noShowRate))
                .avgRating(avgRating)
                .ticketsThisWeek(ticketsThisWeek)
                .ticketsLastWeek(ticketsLastWeek)
                .completedThisWeek(completedThisWeek)
                .completedLastWeek(completedLastWeek)
                .newUsersThisWeek(newUsersThisWeek)
                .newUsersLastWeek(newUsersLastWeek)
                .queues(queueStats)
                .staff(staffStats)
                .dailyTrend(trend)
                .roleDistribution(roleDist)
                .statusBreakdown(statusBreakdown)
                .build();
    }

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