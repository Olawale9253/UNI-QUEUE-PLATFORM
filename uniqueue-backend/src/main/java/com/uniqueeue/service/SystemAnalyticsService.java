package com.uniqueeue.service;

import com.uniqueeue.dto.response.SystemAnalyticsResponse;
import com.uniqueeue.dto.response.SystemAnalyticsResponse.DailyPoint;
import com.uniqueeue.dto.response.SystemAnalyticsResponse.UniversitySummary;
import com.uniqueeue.enums.Role;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
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
        LocalDateTime fourteenDaysAgo = today.minusDays(13).atStartOfDay();
        LocalDateTime sevenDaysAgo = today.minusDays(6).atStartOfDay();
        LocalDateTime fourteenDaysAgoStart = today.minusDays(13).atStartOfDay();

        List<University> universities = universityRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        long activeUniversities = universities.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .count();

        long totalUsers = allUsers.size();
        long totalStaff = allUsers.stream().filter(u -> u.getRole() == Role.STAFF).count();
        long totalAdmins = allUsers.stream().filter(u -> u.getRole() == Role.ADMIN).count();
        long totalQueues = queueRepository.count();
        long activeQueues = queueRepository.findAll().stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsActive()))
                .count();

        long ticketsAllTime = ticketRepository.count();
        long ticketsToday = 0;
        long waitingNow = 0;
        long ticketsThisWeek = 0;
        long ticketsLastWeek = 0;
        long completedThisWeek = 0;
        long completedLastWeek = 0;
        long newUsersThisWeek = 0;
        long newUsersLastWeek = 0;

        // Per-day bucket: [joined, completed, newUsers]
        Map<LocalDate, long[]> daily = new HashMap<>();
        for (int i = 13; i >= 0; i--) {
            daily.put(today.minusDays(i), new long[3]);
        }

        double sumWait = 0, sumService = 0;
        long waitCount = 0, serviceCount = 0;

        List<UniversitySummary> summaries = new ArrayList<>();

        for (University u : universities) {
            long uTicketsToday = ticketRepository.countByUniversitySince(u.getId(), startOfDay);
            long uTicketsAllTime = ticketRepository.countByUniversity(u.getId());
            long uWaiting = ticketRepository.countByUniversityAndStatus(u.getId(), TicketStatus.WAITING);
            long uUsers = allUsers.stream()
                    .filter(x -> x.getUniversity() != null && x.getUniversity().getId().equals(u.getId()))
                    .count();
            long uStaff = allUsers.stream()
                    .filter(x -> x.getUniversity() != null
                            && x.getUniversity().getId().equals(u.getId())
                            && x.getRole() == Role.STAFF)
                    .count();
            long uQueues = queueRepository.countByUniversityId(u.getId());

            ticketsToday += uTicketsToday;
            waitingNow += uWaiting;

            List<Ticket> recent = ticketRepository.findRecentByUniversity(u.getId(), fourteenDaysAgo);
            for (Ticket t : recent) {
                if (t.getJoinedAt() != null) {
                    LocalDate d = t.getJoinedAt().toLocalDate();
                    long[] bucket = daily.get(d);
                    if (bucket != null) bucket[0]++;

                    if (!t.getJoinedAt().isBefore(sevenDaysAgo)) ticketsThisWeek++;
                    else if (!t.getJoinedAt().isBefore(fourteenDaysAgoStart)) ticketsLastWeek++;
                }

                if (t.getStatus() == TicketStatus.COMPLETED) {
                    if (t.getCompletedAt() != null) {
                        LocalDate d = t.getCompletedAt().toLocalDate();
                        long[] bucket = daily.get(d);
                        if (bucket != null) bucket[1]++;

                        if (!t.getCompletedAt().isBefore(sevenDaysAgo)) completedThisWeek++;
                        else if (!t.getCompletedAt().isBefore(fourteenDaysAgoStart)) completedLastWeek++;
                    }
                    if (t.getJoinedAt() != null && t.getCalledAt() != null) {
                        sumWait += Duration.between(t.getJoinedAt(), t.getCalledAt()).toMinutes();
                        waitCount++;
                    }
                    if (t.getServedAt() != null && t.getCompletedAt() != null) {
                        sumService += Duration.between(t.getServedAt(), t.getCompletedAt()).toMinutes();
                        serviceCount++;
                    }
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

        // Count new users per day
        for (User u : allUsers) {
            if (u.getCreatedAt() == null) continue;
            LocalDate d = u.getCreatedAt().toLocalDate();
            long[] bucket = daily.get(d);
            if (bucket != null) bucket[2]++;

            if (!u.getCreatedAt().isBefore(sevenDaysAgo)) newUsersThisWeek++;
            else if (!u.getCreatedAt().isBefore(fourteenDaysAgoStart)) newUsersLastWeek++;
        }

        // Build 14-day trend oldest → newest
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
                .ticketsThisWeek(ticketsThisWeek)
                .ticketsLastWeek(ticketsLastWeek)
                .completedThisWeek(completedThisWeek)
                .completedLastWeek(completedLastWeek)
                .newUsersThisWeek(newUsersThisWeek)
                .newUsersLastWeek(newUsersLastWeek)
                .universities(summaries)
                .dailyTrend(trend)
                .build();
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}