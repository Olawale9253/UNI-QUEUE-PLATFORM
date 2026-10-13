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
                .filter(queueValue -> Boolean.TRUE.equals(queueValue.getIsActive()))
                .count();

        List<User> allUsersOfUniversity = userRepository.findByUniversityId(universityId);
        long totalStaff = allUsersOfUniversity.stream().filter(userValue5 -> userValue5.getRole() == Role.STAFF).count();
        long totalStudents = allUsersOfUniversity.stream().filter(userValue6 -> userValue6.getRole() == Role.USER).count();
        long totalAdmins = allUsersOfUniversity.stream().filter(userValue7 -> userValue7.getRole() == Role.ADMIN).count();

        long ticketsToday = ticketRepository.countByUniversitySince(universityId, startOfDay);
        long ticketsAllTime = ticketRepository.countByUniversity(universityId);
        long waitingNow = ticketRepository.countByUniversityAndStatus(universityId, TicketStatus.WAITING);

        List<Ticket> recent = ticketRepository.findRecentByUniversity(universityId, fourteenDaysAgo);
        List<Ticket> completed = recent.stream()
                .filter(ticketValue4 -> ticketValue4.getStatus() == TicketStatus.COMPLETED)
                .toList();

        double avgWait = avgMinutes(completed, Ticket::getJoinedAt, Ticket::getCalledAt);
        double avgService = avgMinutes(completed, Ticket::getServedAt, Ticket::getCompletedAt);

        long noShowCount = recent.stream()
                .filter(ticketValue5 -> ticketValue5.getStatus() == TicketStatus.NO_SHOW)
                .count();
        long totalResolved = noShowCount + completed.size();
        double noShowRate = totalResolved > 0 ? (noShowCount * 100.0 / totalResolved) : 0;

        Double ratingRaw = feedbackRepository.avgRatingByUniversityId(universityId);
        double avgRating = round1(ratingRaw != null ? ratingRaw : 0);

        // ───────── week-over-week ─────────
        long ticketsThisWeek = 0, ticketsLastWeek = 0;
        long completedThisWeek = 0, completedLastWeek = 0;
        for (Ticket ticketValue6 : recent) {
            if (ticketValue6.getJoinedAt() != null) {
                if (!ticketValue6.getJoinedAt().isBefore(sevenDaysAgo)) ticketsThisWeek++;
                else if (!ticketValue6.getJoinedAt().isBefore(fourteenDaysAgoStart)) ticketsLastWeek++;
            }
            if (ticketValue6.getStatus() == TicketStatus.COMPLETED && ticketValue6.getCompletedAt() != null) {
                if (!ticketValue6.getCompletedAt().isBefore(sevenDaysAgo)) completedThisWeek++;
                else if (!ticketValue6.getCompletedAt().isBefore(fourteenDaysAgoStart)) completedLastWeek++;
            }
        }

        long newUsersThisWeek = 0, newUsersLastWeek = 0;
        Map<LocalDate, long[]> daily = new HashMap<>();
        for (int indexValue3 = 13; indexValue3 >= 0; indexValue3--) daily.put(today.minusDays(indexValue3), new long[3]);

        for (User userValue8 : allUsersOfUniversity) {
            if (userValue8.getCreatedAt() == null) continue;
            LocalDate localDate = userValue8.getCreatedAt().toLocalDate();
            long[] bucket = daily.get(localDate);
            if (bucket != null) bucket[2]++;

            if (!userValue8.getCreatedAt().isBefore(sevenDaysAgo)) newUsersThisWeek++;
            else if (!userValue8.getCreatedAt().isBefore(fourteenDaysAgoStart)) newUsersLastWeek++;
        }

        for (Ticket ticketValue7 : recent) {
            if (ticketValue7.getJoinedAt() != null) {
                long[] bucket = daily.get(ticketValue7.getJoinedAt().toLocalDate());
                if (bucket != null) bucket[0]++;
            }
            if (ticketValue7.getCompletedAt() != null) {
                long[] bucket = daily.get(ticketValue7.getCompletedAt().toLocalDate());
                if (bucket != null) bucket[1]++;
            }
        }

        // ───────── per-queue ─────────
        List<QueueStats> queueStats = new ArrayList<>();
        for (Queue queueValue2 : queues) {
            List<Ticket> qRecent = ticketRepository.findRecentByQueue(queueValue2.getId(), fourteenDaysAgo);

            long qToday = qRecent.stream()
                    .filter(ticketValue8 -> ticketValue8.getJoinedAt() != null && ticketValue8.getJoinedAt().toLocalDate().equals(today))
                    .count();

            List<Ticket> qCompleted = qRecent.stream()
                    .filter(ticketValue9 -> ticketValue9.getStatus() == TicketStatus.COMPLETED)
                    .toList();

            long qServedToday = qCompleted.stream()
                    .filter(ticketValue10 -> ticketValue10.getCompletedAt() != null && ticketValue10.getCompletedAt().toLocalDate().equals(today))
                    .count();

            long qWaiting = ticketRepository.countByQueueAndStatus(queueValue2.getId(), TicketStatus.WAITING);

            double qAvgWait = avgMinutes(qCompleted, Ticket::getJoinedAt, Ticket::getCalledAt);
            double qAvgService = avgMinutes(qCompleted, Ticket::getServedAt, Ticket::getCompletedAt);

            long qNoShows = qRecent.stream().filter(ticketValue11 -> ticketValue11.getStatus() == TicketStatus.NO_SHOW).count();
            long qResolved = qNoShows + qCompleted.size();
            double qNoShowRate = qResolved > 0 ? (qNoShows * 100.0 / qResolved) : 0;

            Double qRatingRaw = feedbackRepository.avgRatingByQueueId(queueValue2.getId());

            queueStats.add(QueueStats.builder()
                    .queueId(queueValue2.getId())
                    .queueName(queueValue2.getName())
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
        for (User userValue9 : staff) {
            List<Ticket> sTickets = ticketRepository.findRecentByStaff(userValue9.getId(), fourteenDaysAgo);
            List<Ticket> sCompleted = sTickets.stream()
                    .filter(ticketValue12 -> ticketValue12.getStatus() == TicketStatus.COMPLETED)
                    .toList();
            double sAvgService = avgMinutes(sCompleted, Ticket::getServedAt, Ticket::getCompletedAt);
            Double sRatingRaw = feedbackRepository.avgRatingByStaffId(userValue9.getId());

            staffStats.add(StaffPerformance.builder()
                    .staffId(userValue9.getId())
                    .fullName(userValue9.getFullName())
                    .ticketsServed(sCompleted.size())
                    .avgServiceMinutes(round1(sAvgService))
                    .avgRating(round1(sRatingRaw != null ? sRatingRaw : 0))
                    .build());
        }

        // ───────── daily trend (14 days) ─────────
        List<DailyPoint> trend = new ArrayList<>();
        for (int indexValue4 = 13; indexValue4 >= 0; indexValue4--) {
            LocalDate localDateValue = today.minusDays(indexValue4);
            long[] numberValue = daily.getOrDefault(localDateValue, new long[3]);
            trend.add(DailyPoint.builder()
                    .date(localDateValue)
                    .joined(numberValue[0])
                    .completed(numberValue[1])
                    .newUsers(numberValue[2])
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
            long count = recent.stream().filter(ticketValue13 -> ticketValue13.getStatus() == status).count();
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
                .filter(ticketValue14 -> start.apply(ticketValue14) != null && end.apply(ticketValue14) != null)
                .mapToLong(ticketValue15 -> Duration.between(start.apply(ticketValue15), end.apply(ticketValue15)).toMinutes())
                .average()
                .orElse(0);
    }

    private double round1(double numericValue) {
        return Math.round(numericValue * 10.0) / 10.0;
    }
}