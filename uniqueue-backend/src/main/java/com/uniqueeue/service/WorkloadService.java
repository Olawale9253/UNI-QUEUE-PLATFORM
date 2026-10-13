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

        for (Queue queueValue9 : queues) {
            long waiting = countWaiting(queueValue9.getId());
            long staff = queueStaffRepository.countByQueueId(queueValue9.getId());
            int avg = queueValue9.getAverageServiceMinutes() != null ? queueValue9.getAverageServiceMinutes() : DEFAULT_AVG_MIN;
            int est = (int) Math.min(Integer.MAX_VALUE, waiting * (long) avg);
            double ratio = round1((double) waiting / Math.max(1, staff));

            allLoads.add(WorkloadResponse.QueueLoad.builder()
                    .queueId(queueValue9.getId())
                    .queueName(queueValue9.getName())
                    .waitingCount(waiting)
                    .staffCount(staff)
                    .ratio(ratio)
                    .avgServiceMinutes(avg)
                    .estWaitMinutes(est)
                    .isOpen(Boolean.TRUE.equals(queueValue9.getIsActive()))
                    .level(classify(waiting, staff, ratio))
                    .build());

            totalWaiting += waiting;
            totalStaffAssignments += staff;
        }

        // Group by office
        Map<Long, String> officeNames = new LinkedHashMap<>();
        Map<Long, List<WorkloadResponse.QueueLoad>> byOffice = new LinkedHashMap<>();

        for (int indexValue14 = 0; indexValue14 < queues.size(); indexValue14++) {
            Queue queueValue10 = queues.get(indexValue14);
            WorkloadResponse.QueueLoad load = allLoads.get(indexValue14);

            Long officeId = queueValue10.getOffice() != null ? queueValue10.getOffice().getId() : 0L;
            String officeName = queueValue10.getOffice() != null && queueValue10.getOffice().getName() != null
                    ? queueValue10.getOffice().getName()
                    : "General";

            officeNames.putIfAbsent(officeId, officeName);
            byOffice.computeIfAbsent(officeId, itemIndexValue2 -> new ArrayList<>()).add(load);
        }

        List<WorkloadResponse.OfficeLoad> offices = new ArrayList<>();
        String worstOfficeName = null;
        long worstOfficeWaiting = -1;

        for (Map.Entry<Long, List<WorkloadResponse.QueueLoad>> queueLoad : byOffice.entrySet()) {
            List<WorkloadResponse.QueueLoad> qls = queueLoad.getValue();

            long numberValueValue2 = qls.stream().mapToLong(WorkloadResponse.QueueLoad::getWaitingCount).sum();
            long numberValueValue3 = qls.stream().mapToLong(WorkloadResponse.QueueLoad::getStaffCount).sum();
            int maxEst = qls.stream().mapToInt(WorkloadResponse.QueueLoad::getEstWaitMinutes).max().orElse(0);
            double ratio = round1((double) numberValueValue2 / Math.max(1, numberValueValue3));

            List<WorkloadResponse.QueueLoad> sortedQueues = qls.stream()
                    .sorted(Comparator.comparing(WorkloadResponse.QueueLoad::getRatio).reversed())
                    .collect(Collectors.toList());

            offices.add(WorkloadResponse.OfficeLoad.builder()
                    .officeId(queueLoad.getKey())
                    .officeName(officeNames.get(queueLoad.getKey()))
                    .queueCount(qls.size())
                    .waitingCount(numberValueValue2)
                    .staffCount(numberValueValue3)
                    .ratio(ratio)
                    .estWaitMinutes(maxEst)
                    .level(classify(numberValueValue2, numberValueValue3, ratio))
                    .queues(sortedQueues)
                    .build());

            // Only track a "worst office" when someone is actually waiting.
            // Otherwise the first alphabetical office wins on a 0-0 tie, which is misleading.
            if (numberValueValue2 > worstOfficeWaiting && numberValueValue2 > 0) {
                worstOfficeWaiting = numberValueValue2;
                worstOfficeName = officeNames.get(queueLoad.getKey());
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

    private double round1(double doubleValue2) {
        return Math.round(doubleValue2 * 10.0) / 10.0;
    }

    private String classify(long waiting, long staff, double ratio) {
        if (waiting > 0 && staff == 0) return "CRITICAL";
        if (ratio >= 15) return "CRITICAL";
        if (ratio >= 7) return "HIGH";
        if (ratio >= 3) return "MEDIUM";
        return "LOW";
    }
}