package com.uniqueeue.service;

import com.uniqueeue.model.University;
import com.uniqueeue.model.UniversityClosedDate;
import com.uniqueeue.repository.UniversityClosedDateRepository;
import com.uniqueeue.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/**
 * Pulls public holidays from Nager.Date (https://date.nager.at) and upserts
 * them into university_closed_dates with source = 'AUTO'.
 *
 * The sync is idempotent: every holiday carries an externalId of the form
 * "NG:2026-01-01" so re-running never creates duplicates.
 *
 * Admins can still manually delete an AUTO entry if their university doesn't
 * observe a particular holiday (the sync won't re-add it unless you clear the
 * external_id first — see note below).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PublicHolidaySyncService {

    private final UniversityRepository universityRepository;
    private final UniversityClosedDateRepository closedDateRepository;
    private final RestTemplate restTemplate;

    @Value("${uniqueeue.holidays.api-base:https://date.nager.at/api/v3}")
    private String apiBase;

    /**
     * Sync holidays for every active university. Fetches current year and next year.
     * Called from the scheduler and the manual admin trigger.
     */
    @Transactional
    public SyncResult syncAll() {
        int universitiesSynced = 0;
        int holidaysAdded = 0;
        int holidaysSkipped = 0;

        int currentYear = LocalDate.now().getYear();

        List<University> universities = universityRepository.findAll();
        for (University uni : universities) {
            if (!Boolean.TRUE.equals(uni.getIsActive())) continue;

            for (int year : new int[]{ currentYear, currentYear + 1 }) {
                try {
                    SyncCounters c = syncForUniversity(uni, year);
                    holidaysAdded += c.added;
                    holidaysSkipped += c.skipped;
                } catch (Exception e) {
                    log.warn("Holiday sync failed for {} ({}) — {}",
                            uni.getName(), uni.getCountryCode(), e.getMessage());
                }
            }
            universitiesSynced++;
        }

        log.info("Holiday sync complete: {} universities, {} added, {} already present",
                universitiesSynced, holidaysAdded, holidaysSkipped);

        return new SyncResult(universitiesSynced, holidaysAdded, holidaysSkipped);
    }

    @Transactional
    public SyncResult syncOne(University uni) {
        int added = 0;
        int skipped = 0;
        int currentYear = LocalDate.now().getYear();
        for (int year : new int[]{ currentYear, currentYear + 1 }) {
            SyncCounters c = syncForUniversity(uni, year);
            added += c.added;
            skipped += c.skipped;
        }
        return new SyncResult(1, added, skipped);
    }

    private SyncCounters syncForUniversity(University uni, int year) {
        String code = uni.getCountryCode() != null ? uni.getCountryCode() : "NG";
        String url = apiBase + "/publicholidays/" + year + "/" + code;

        HolidayDto[] holidays;
        try {
            holidays = restTemplate.getForObject(url, HolidayDto[].class);
        } catch (Exception e) {
            log.debug("No holiday data for {}/{} — {}", code, year, e.getMessage());
            return new SyncCounters(0, 0);
        }
        if (holidays == null) return new SyncCounters(0, 0);

        int added = 0;
        int skipped = 0;

        for (HolidayDto h : holidays) {
            // Only national (global=true) holidays. Skip regional observances.
            if (h.global == null || !h.global) continue;

            // Only Public type — skip Bank/School/Authorities.
            if (h.types == null || !Arrays.asList(h.types).contains("Public")) continue;

            LocalDate holidayDate = LocalDate.parse(h.date);
            String externalId = code + ":" + h.date;

            // ── Check by (university, date) — catches manually-added entries too ──
            var existing = closedDateRepository.findByUniversityIdAndClosedDate(
                    uni.getId(), holidayDate);

            if (existing.isPresent()) {
                UniversityClosedDate row = existing.get();
                // Adopt a manual entry: promote it to AUTO so future syncs are idempotent.
                if (row.getExternalId() == null) {
                    row.setSource("AUTO");
                    row.setExternalId(externalId);
                    closedDateRepository.save(row);
                    log.info("Adopted manual holiday {} ({}) as AUTO for university {}",
                            h.date, h.localName, uni.getId());
                }
                skipped++;
                continue;
            }

            UniversityClosedDate entity = UniversityClosedDate.builder()
                    .university(uni)
                    .closedDate(holidayDate)
                    .reason(h.localName != null ? h.localName : h.name)
                    .source("AUTO")
                    .externalId(externalId)
                    .build();

            closedDateRepository.save(entity);
            added++;
        }

        return new SyncCounters(added, skipped);
    }

    // ── DTO for the Nager.Date response ──
    public static class HolidayDto {
        public String date;
        public String localName;
        public String name;
        public String countryCode;
        public Boolean global;
        public String[] types;
    }

    private record SyncCounters(int added, int skipped) {}

    public record SyncResult(int universitiesSynced, int holidaysAdded, int holidaysSkipped) {}
}