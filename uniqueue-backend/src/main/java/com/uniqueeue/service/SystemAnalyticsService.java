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
                .filter(universityValue10 -> Boolean.TRUE.equals(universityValue10.getIsActive()))
                .count();

        long totalUsers = allUsers.size();
        long totalStaff = allUsers.stream().filter(userValue14 -> userValue14.getRole() == Role.STAFF).count();
        long totalAdmins = allUsers.stream().filter(userValue15 -> userValue15.getRole() == Role.ADMIN).count();
        long totalQueues = queueRepository.count();
        long activeQueues = queueRepository.findAll().stream()
                .filter(queueValue4 -> Boolean.TRUE.equals(queueValue4.getIsActive()))
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
        for (int indexValue5 = 13; indexValue5 >= 0; indexValue5--) {
            daily.put(today.minusDays(indexValue5), new long[3]);
        }

        double sumWait = 0, sumService = 0;
        long waitCount = 0, serviceCount = 0;

        List<UniversitySummary> summaries = new ArrayList<>();

        for (University universityValue11 : universities) {
            long uTicketsToday = ticketRepository.countByUniversitySince(universityValue11.getId(), startOfDay);
            long uTicketsAllTime = ticketRepository.countByUniversity(universityValue11.getId());
            long uWaiting = ticketRepository.countByUniversityAndStatus(universityValue11.getId(), TicketStatus.WAITING);
            long uUsers = allUsers.stream()
                    .filter(userValue16 -> userValue16.getUniversity() != null && userValue16.getUniversity().getId().equals(universityValue11.getId()))
                    .count();
            long uStaff = allUsers.stream()
                    .filter(userValue17 -> userValue17.getUniversity() != null
                            && userValue17.getUniversity().getId().equals(universityValue11.getId())
                            && userValue17.getRole() == Role.STAFF)
                    .count();
            long uQueues = queueRepository.countByUniversityId(universityValue11.getId());

            ticketsToday += uTicketsToday;
            waitingNow += uWaiting;

            List<Ticket> recent = ticketRepository.findRecentByUniversity(universityValue11.getId(), fourteenDaysAgo);
            for (Ticket ticketValue23 : recent) {
                if (ticketValue23.getJoinedAt() != null) {
                    LocalDate localDateValue2 = ticketValue23.getJoinedAt().toLocalDate();
                    long[] bucket = daily.get(localDateValue2);
                    if (bucket != null) bucket[0]++;

                    if (!ticketValue23.getJoinedAt().isBefore(sevenDaysAgo)) ticketsThisWeek++;
                    else if (!ticketValue23.getJoinedAt().isBefore(fourteenDaysAgoStart)) ticketsLastWeek++;
                }

                if (ticketValue23.getStatus() == TicketStatus.COMPLETED) {
                    if (ticketValue23.getCompletedAt() != null) {
                        LocalDate localDateValue3 = ticketValue23.getCompletedAt().toLocalDate();
                        long[] bucket = daily.get(localDateValue3);
                        if (bucket != null) bucket[1]++;

                        if (!ticketValue23.getCompletedAt().isBefore(sevenDaysAgo)) completedThisWeek++;
                        else if (!ticketValue23.getCompletedAt().isBefore(fourteenDaysAgoStart)) completedLastWeek++;
                    }
                    if (ticketValue23.getJoinedAt() != null && ticketValue23.getCalledAt() != null) {
                        sumWait += Duration.between(ticketValue23.getJoinedAt(), ticketValue23.getCalledAt()).toMinutes();
                        waitCount++;
                    }
                    if (ticketValue23.getServedAt() != null && ticketValue23.getCompletedAt() != null) {
                        sumService += Duration.between(ticketValue23.getServedAt(), ticketValue23.getCompletedAt()).toMinutes();
                        serviceCount++;
                    }
                }
            }

            summaries.add(UniversitySummary.builder()
                    .universityId(universityValue11.getId())
                    .name(universityValue11.getName())
                    .code(universityValue11.getCode())
                    .isActive(Boolean.TRUE.equals(universityValue11.getIsActive()))
                    .users(uUsers)
                    .staff(uStaff)
                    .queues(uQueues)
                    .ticketsToday(uTicketsToday)
                    .ticketsAllTime(uTicketsAllTime)
                    .build());
        }

        // Count new users per day
        for (User userValue18 : allUsers) {
            if (userValue18.getCreatedAt() == null) continue;
            LocalDate localDateValue4 = userValue18.getCreatedAt().toLocalDate();
            long[] bucket = daily.get(localDateValue4);
            if (bucket != null) bucket[2]++;

            if (!userValue18.getCreatedAt().isBefore(sevenDaysAgo)) newUsersThisWeek++;
            else if (!userValue18.getCreatedAt().isBefore(fourteenDaysAgoStart)) newUsersLastWeek++;
        }

        // Build 14-day trend oldest → newest
        List<DailyPoint> trend = new ArrayList<>();
        for (int indexValue6 = 13; indexValue6 >= 0; indexValue6--) {
            LocalDate localDateValue5 = today.minusDays(indexValue6);
            long[] numberValueValue = daily.getOrDefault(localDateValue5, new long[3]);
            trend.add(DailyPoint.builder()
                    .date(localDateValue5)
                    .joined(numberValueValue[0])
                    .completed(numberValueValue[1])
                    .newUsers(numberValueValue[2])
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

    private double round1(double doubleValue) { return Math.round(doubleValue * 10.0) / 10.0; }
}