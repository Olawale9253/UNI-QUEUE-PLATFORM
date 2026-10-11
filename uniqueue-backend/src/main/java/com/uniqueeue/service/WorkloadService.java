package com.uniqueeue.service;

import com.uniqueeue.dto.response.WorkloadResponse;
import com.uniqueeue.model.Queue;
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.QueueStaffRepository;
import com.uniqueeue.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkloadService {

    private final QueueRepository queueRepository;
    private final QueueStaffRepository queueStaffRepository;
    private final TicketRepository ticketRepository;

    private static final int DEFAULT_AVG_MIN = 5;

    @Transactional(readOnly = true)
    public WorkloadResponse getWorkload(Long universityId) {
        List<Queue> queues = queueRepository.findByUniversityIdOrderByNameAsc(universityId);

        List<WorkloadResponse.QueueLoad> allLoads = new ArrayList<>(queues.size());
        long totalWaiting = 0;
        long totalStaffAssignments = 0;

        for (Queue q : queues) {
            long waiting = countWaiting(q.getId());
            long staff = queueStaffRepository.countByQueueId(q.getId());
            int avg = q.getAverageServiceMinutes() != null ? q.getAverageServiceMinutes() : DEFAULT_AVG_MIN;
            int est = (int) Math.min(Integer.MAX_VALUE, waiting * (long) avg);
            double ratio = round1((double) waiting / Math.max(1, staff));

            allLoads.add(WorkloadResponse.QueueLoad.builder()
                    .queueId(q.getId())
                    .queueName(q.getName())
                    .waitingCount(waiting)
                    .staffCount(staff)
                    .ratio(ratio)
                    .avgServiceMinutes(avg)
                    .estWaitMinutes(est)
                    .isOpen(Boolean.TRUE.equals(q.getIsActive()))
                    .level(classify(waiting, staff, ratio))
                    .build());

            totalWaiting += waiting;
            totalStaffAssignments += staff;
        }

        // Group by office
        Map<Long, String> officeNames = new LinkedHashMap<>();
        Map<Long, List<WorkloadResponse.QueueLoad>> byOffice = new LinkedHashMap<>();

        for (int i = 0; i < queues.size(); i++) {
            Queue q = queues.get(i);
            WorkloadResponse.QueueLoad load = allLoads.get(i);

            Long officeId = q.getOffice() != null ? q.getOffice().getId() : 0L;
            String officeName = q.getOffice() != null && q.getOffice().getName() != null
                    ? q.getOffice().getName()
                    : "General";

            officeNames.putIfAbsent(officeId, officeName);
            byOffice.computeIfAbsent(officeId, k -> new ArrayList<>()).add(load);
        }

        List<WorkloadResponse.OfficeLoad> offices = new ArrayList<>();
        String worstOfficeName = null;
        long worstOfficeWaiting = -1;

        for (Map.Entry<Long, List<WorkloadResponse.QueueLoad>> e : byOffice.entrySet()) {
            List<WorkloadResponse.QueueLoad> qls = e.getValue();

            long w = qls.stream().mapToLong(WorkloadResponse.QueueLoad::getWaitingCount).sum();
            long s = qls.stream().mapToLong(WorkloadResponse.QueueLoad::getStaffCount).sum();
            int maxEst = qls.stream().mapToInt(WorkloadResponse.QueueLoad::getEstWaitMinutes).max().orElse(0);
            double ratio = round1((double) w / Math.max(1, s));

            List<WorkloadResponse.QueueLoad> sortedQueues = qls.stream()
                    .sorted(Comparator.comparing(WorkloadResponse.QueueLoad::getRatio).reversed())
                    .collect(Collectors.toList());

            offices.add(WorkloadResponse.OfficeLoad.builder()
                    .officeId(e.getKey())
                    .officeName(officeNames.get(e.getKey()))
                    .queueCount(qls.size())
                    .waitingCount(w)
                    .staffCount(s)
                    .ratio(ratio)
                    .estWaitMinutes(maxEst)
                    .level(classify(w, s, ratio))
                    .queues(sortedQueues)
                    .build());

            // Only track a "worst office" when someone is actually waiting.
            // Otherwise the first alphabetical office wins on a 0-0 tie, which is misleading.
            if (w > worstOfficeWaiting && w > 0) {
                worstOfficeWaiting = w;
                worstOfficeName = officeNames.get(e.getKey());
            }
        }

        offices.sort(Comparator.comparing(WorkloadResponse.OfficeLoad::getRatio).reversed());

        double overallRatio = (double) totalWaiting / Math.max(1, totalStaffAssignments);

        return WorkloadResponse.builder()
                .universityId(universityId)
                .generatedAt(LocalDateTime.now())
                .summary(WorkloadResponse.Summary.builder()
                        .totalWaiting(totalWaiting)
                        .totalStaff(totalStaffAssignments)
                        .totalQueues((long) queues.size())
                        .totalOffices((long) offices.size())
                        .worstOfficeName(totalWaiting > 0 ? worstOfficeName : null)
                        .worstOfficeWaiting(totalWaiting > 0 ? Math.max(0, worstOfficeWaiting) : 0L)
                        .overallLevel(classify(totalWaiting, totalStaffAssignments, overallRatio))
                        .build())
                .offices(offices)
                .build();
    }

    /* ------------------------------------------------------ */

    private long countWaiting(Long queueId) {
        return ticketRepository.findWaitingByQueueId(queueId).size();
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private String classify(long waiting, long staff, double ratio) {
        if (waiting > 0 && staff == 0) return "CRITICAL";
        if (ratio >= 15) return "CRITICAL";
        if (ratio >= 7) return "HIGH";
        if (ratio >= 3) return "MEDIUM";
        return "LOW";
    }
}