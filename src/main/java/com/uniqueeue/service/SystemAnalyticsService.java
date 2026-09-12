package com.uniqueeue.service;

import com.uniqueeue.dto.response.SystemAnalyticsResponse;
import com.uniqueeue.dto.response.SystemAnalyticsResponse.DailyPoint;
import com.uniqueeue.dto.response.SystemAnalyticsResponse.UniversitySummary;
import com.uniqueeue.enums.Role;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.University;
import com.uniqueeue.repository.*;
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
public class SystemAnalyticsService {

    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final QueueRepository queueRepository;
    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public SystemAnalyticsResponse overview() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime sevenDaysAgo = today.minusDays(6).atStartOfDay();

        List<University> universities = universityRepository.findAll();

        long activeUniversities = universities.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .count();

        long totalUsers = userRepository.count();
        long totalStaff = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STAFF).count();
        long totalAdmins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN).count();
        long totalQueues = queueRepository.count();
        long activeQueues = queueRepository.findAll().stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsActive()))
                .count();

        long ticketsToday = 0;
        long ticketsAllTime = ticketRepository.count();
        long waitingNow = 0;
        long completedLast7 = 0;
        double sumWait = 0, sumService = 0;
        long waitCount = 0, serviceCount = 0;

        List<UniversitySummary> summaries = new ArrayList<>();
        Map<LocalDate, long[]> daily = new HashMap<>();

        for (University u : universities) {
            long uTicketsToday = ticketRepository.countByUniversitySince(u.getId(), startOfDay);
            long uTicketsAllTime = ticketRepository.countByUniversity(u.getId());
            long uWaiting = ticketRepository.countByUniversityAndStatus(u.getId(), TicketStatus.WAITING);
            long uUsers = userRepository.findAll().stream()
                    .filter(x -> x.getUniversity() != null && x.getUniversity().getId().equals(u.getId()))
                    .count();
            long uStaff = userRepository.findByUniversityIdAndRole(u.getId(), Role.STAFF).size();
            long uQueues = queueRepository.countByUniversityId(u.getId());

            ticketsToday += uTicketsToday;
            waitingNow += uWaiting;

            List<Ticket> recent = ticketRepository.findRecentByUniversity(u.getId(), sevenDaysAgo);
            for (Ticket t : recent) {
                if (t.getStatus() == TicketStatus.COMPLETED) {
                    completedLast7++;
                    if (t.getJoinedAt() != null && t.getCalledAt() != null) {
                        sumWait += Duration.between(t.getJoinedAt(), t.getCalledAt()).toMinutes();
                        waitCount++;
                    }
                    if (t.getServedAt() != null && t.getCompletedAt() != null) {
                        sumService += Duration.between(t.getServedAt(), t.getCompletedAt()).toMinutes();
                        serviceCount++;
                    }
                }
                if (t.getJoinedAt() != null) {
                    daily.computeIfAbsent(t.getJoinedAt().toLocalDate(), k -> new long[2])[0]++;
                }
                if (t.getCompletedAt() != null) {
                    daily.computeIfAbsent(t.getCompletedAt().toLocalDate(), k -> new long[2])[1]++;
                }
            }

            summaries.add(UniversitySummary.builder()
                    .universityId(u.getId())
                    .name(u.getName())
                    .code(u.getCode())
                    .isActive(Boolean.TRUE.equals(u.getIsActive()))
                    .users(uUsers)
                    .staff(uStaff)
                    .queues(uQueues)
                    .ticketsToday(uTicketsToday)
                    .ticketsAllTime(uTicketsAllTime)
                    .build());
        }

        List<DailyPoint> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            long[] counts = daily.getOrDefault(d, new long[2]);
            trend.add(DailyPoint.builder()
                    .date(d).joined(counts[0]).completed(counts[1]).build());
        }

        return SystemAnalyticsResponse.builder()
                .totalUniversities(universities.size())
                .activeUniversities(activeUniversities)
                .totalUsers(totalUsers)
                .totalStaff(totalStaff)
                .totalAdmins(totalAdmins)
                .totalQueues(totalQueues)
                .activeQueues(activeQueues)
                .ticketsToday(ticketsToday)
                .ticketsAllTime(ticketsAllTime)
                .waitingNow(waitingNow)
                .avgWaitMinutes(round1(waitCount > 0 ? sumWait / waitCount : 0))
                .avgServiceMinutes(round1(serviceCount > 0 ? sumService / serviceCount : 0))
                .universities(summaries)
                .dailyTrend(trend)
                .build();
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}