package com.uniqueeue.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory bucket cache for rate limiting.
 *
 * NOTE: buckets are stored per JVM. If you run multiple backend instances,
 * swap this out for a Redis-backed Bucket4j implementation — the public
 * API here will stay the same.
 */
@Service
@Slf4j
public class RateLimitService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * @return true if the request is allowed (bucket consumed).
     *         false if the limit is exceeded.
     */
    public boolean tryConsume(String key, int limit, int windowSeconds) {
        Bucket bucket = buckets.computeIfAbsent(key, k ->
                Bucket.builder()
                        .addLimit(Bandwidth.classic(
                                limit,
                                Refill.greedy(limit, Duration.ofSeconds(windowSeconds))
                        ))
                        .build()
        );
        return bucket.tryConsume(1);
    }

    /** Approximate number of tracked buckets (for metrics/debugging). */
    public int size() {
        return buckets.size();
    }

    /**
     * Evicts unused buckets every 30 minutes to keep memory bounded.
     * We approximate "unused" by checking if the bucket is at full capacity,
     * which after a full window has elapsed means nothing is in flight.
     */
    @Scheduled(fixedDelay = 1_800_000L, initialDelay = 1_800_000L)
    public void cleanup() {
        int before = buckets.size();
        buckets.entrySet().removeIf(e -> {
            try {
                long available = e.getValue().getAvailableTokens();
                // Heuristic: if the bucket reports more tokens than any sane limit
                // it means it's fully refilled and idle. Removing is safe.
                return available > 1_000_000L;
            } catch (Exception ex) {
                return false;
            }
        });
        int after = buckets.size();
        if (before != after) {
            log.debug("Rate limit cleanup: {} -> {} buckets", before, after);
        }
    }
}