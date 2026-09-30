package com.uniqueeue.service;

import com.uniqueeue.model.Queue;
import com.uniqueeue.repository.UniversityClosedDateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class QueueScheduleService {

    private static final ZoneId FALLBACK = ZoneId.of("Africa/Lagos");

    private final UniversityClosedDateRepository closedDateRepository;

    /**
     * True if the queue is currently accepting joins.
     * Correctly handles: null windows, overnight windows, day-of-week rules,
     * university holidays, and per-university timezones.
     */
    public boolean isWithinOperatingHours(Queue queue) {
        if (queue.getOpensAt() == null || queue.getClosesAt() == null) return true;
        if (!Boolean.TRUE.equals(queue.getIsActive())) return false;

        ZoneId zone = zoneFor(queue);
        ZonedDateTime nowZ = ZonedDateTime.now(zone);
        LocalTime now = nowZ.toLocalTime();
        LocalTime open = queue.getOpensAt();
        LocalTime close = queue.getClosesAt();

        // --- Time-of-day check ---
        boolean withinTime;
        boolean postMidnightPortion = false;

        if (open.equals(close)) {
            withinTime = true;
        } else if (open.isBefore(close)) {
            withinTime = !now.isBefore(open) && !now.isAfter(close);
        } else {
            // Overnight window (e.g. 22:00 → 02:00)
            if (!now.isBefore(open)) {
                withinTime = true;                  // evening portion, same day
            } else if (!now.isAfter(close)) {
                withinTime = true;                  // post-midnight, opened yesterday
                postMidnightPortion = true;
            } else {
                withinTime = false;
            }
        }
        if (!withinTime) return false;

        // The "operating day" is the day the window OPENED, not today.
        LocalDate operatingDate = postMidnightPortion
                ? nowZ.toLocalDate().minusDays(1)
                : nowZ.toLocalDate();

        // --- Holiday check (per university) ---
        if (closedDateRepository.existsByUniversityIdAndClosedDate(
                queue.getUniversity().getId(), operatingDate)) {
            return false;
        }

        // --- Day-of-week check ---
        return isOperatingDay(queue, operatingDate.getDayOfWeek());
    }

    public ZoneId zoneFor(Queue queue) {
        String tz = queue.getUniversity() != null ? queue.getUniversity().getTimezone() : null;
        if (tz == null || tz.isBlank()) return FALLBACK;
        try {
            return ZoneId.of(tz);
        } catch (Exception ignored) {
            return FALLBACK;
        }
    }

    private boolean isOperatingDay(Queue queue, DayOfWeek day) {
        String csv = queue.getOperatingDays();
        if (csv == null || csv.isBlank()) return true;    // default = all days
        int dow = day.getValue();                          // 1=Mon .. 7=Sun
        for (String part : csv.split(",")) {
            try {
                if (Integer.parseInt(part.trim()) == dow) return true;
            } catch (NumberFormatException ignored) { }
        }
        return false;
    }
}