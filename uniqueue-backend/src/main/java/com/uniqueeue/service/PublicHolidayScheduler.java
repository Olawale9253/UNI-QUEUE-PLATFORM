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
            PublicHolidaySyncService.SyncResult syncResultValue = syncService.syncAll();
            log.info("Holiday sync done — universities={}, added={}, skipped={}",
                    syncResultValue.universitiesSynced(), syncResultValue.holidaysAdded(), syncResultValue.holidaysSkipped());
        } catch (Exception exceptionValue10) {
            log.error("Holiday sync failed", exceptionValue10);
        }
    }
}