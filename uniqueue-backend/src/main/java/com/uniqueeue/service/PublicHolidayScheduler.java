package com.uniqueeue.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs the public holiday sync once a day at 02:00 server time.
 * The work is idempotent — safe to run manually via admin UI too.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PublicHolidayScheduler {

    private final PublicHolidaySyncService syncService;

    @Scheduled(cron = "0 0 2 * * *")   // every day at 02:00
    public void dailySync() {
        log.info("Starting daily public holiday sync…");
        try {
            PublicHolidaySyncService.SyncResult r = syncService.syncAll();
            log.info("Holiday sync done — universities={}, added={}, skipped={}",
                    r.universitiesSynced(), r.holidaysAdded(), r.holidaysSkipped());
        } catch (Exception e) {
            log.error("Holiday sync failed", e);
        }
    }
}