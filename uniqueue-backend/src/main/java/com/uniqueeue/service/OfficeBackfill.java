package com.uniqueeue.service;

import com.uniqueeue.model.Office;
import com.uniqueeue.model.Queue;
import com.uniqueeue.repository.OfficeRepository;
import com.uniqueeue.repository.QueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * On startup:
 *   1. Queues that have a legacy `department` string but no office → link to
 *      (or create) an office with that name.
 *   2. Queues with neither an office nor a department → link to a per-university
 *      "General" office so nothing ever appears as "unassigned".
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OfficeBackfill implements ApplicationRunner {

    private static final String GENERAL_OFFICE_NAME = "General";

    private final QueueRepository queueRepository;
    private final OfficeRepository officeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Queue> orphans = queueRepository.findByOfficeIsNull();
        if (orphans.isEmpty()) return;

        log.info("Backfilling offices for {} unassigned queue(s)…", orphans.size());
        int created = 0;
        int linked = 0;

        for (Queue queueValue3 : orphans) {
            Long uniId = queueValue3.getUniversity().getId();

            String targetName;
            if (queueValue3.getDepartment() != null && !queueValue3.getDepartment().isBlank()) {
                targetName = queueValue3.getDepartment().trim();
            } else {
                targetName = GENERAL_OFFICE_NAME;
            }

            final String lookupName = targetName;
            boolean[] fresh = { false };
            Office office = officeRepository
                    .findByUniversityIdAndNameIgnoreCase(uniId, lookupName)
                    .orElseGet(() -> {
                        fresh[0] = true;
                        return officeRepository.save(Office.builder()
                                .university(queueValue3.getUniversity())
                                .name(lookupName)
                                .location(queueValue3.getLocation())
                                .description(GENERAL_OFFICE_NAME.equals(lookupName)
                                        ? "Default office for services that haven't been categorized yet."
                                        : null)
                                .isActive(true)
                                .build());
                    });

            if (fresh[0]) created++;
            queueValue3.setOffice(office);
            queueValue3.setDepartment(office.getName()); // keep in sync
            queueRepository.save(queueValue3);
            linked++;
        }

        log.info("Office backfill complete: {} linked, {} new offices created",
                linked, created);
    }
}