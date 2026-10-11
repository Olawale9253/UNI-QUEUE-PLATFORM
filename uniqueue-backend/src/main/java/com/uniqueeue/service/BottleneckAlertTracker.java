package com.uniqueeue.service;

import com.uniqueeue.config.BottleneckProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory cooldown tracker.
 *
 * Not persisted across restarts — a restart can re-fire an alert for a step
 * that was alerted earlier in the day. That's acceptable for v1: the volume is
 * low and the worst case is a duplicate email.
 */
@Component
@RequiredArgsConstructor
public class BottleneckAlertTracker {

    private final BottleneckProperties props;

    /** key = "universityId:workflowId:stepOrder" → last alert timestamp */
    private final Map<String, Instant> lastAlertAt = new ConcurrentHashMap<>();

    public boolean shouldAlert(Long universityId, Long workflowId, Integer stepOrder) {
        String key = key(universityId, workflowId, stepOrder);
        Instant last = lastAlertAt.get(key);
        if (last == null) return true;
        long hours = Duration.between(last, Instant.now()).toHours();
        return hours >= props.getCooldownHours();
    }

    public void markAlerted(Long universityId, Long workflowId, Integer stepOrder) {
        lastAlertAt.put(key(universityId, workflowId, stepOrder), Instant.now());
    }

    /** For tests. */
    public void reset() {
        lastAlertAt.clear();
    }

    private String key(Long u, Long w, Integer s) {
        return u + ":" + w + ":" + s;
    }
}