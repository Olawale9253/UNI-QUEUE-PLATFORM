package com.uniqueeue.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RateLimitService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Attempts to consume one token from the bucket.
     *
     * @return 0 if the request is allowed. Otherwise, the approximate
     *         number of seconds the client should wait before retrying
     *         (i.e. until at least one token is refilled).
     */
    public long tryConsume(String key, int limit, int windowSeconds) {
        Bucket bucket = buckets.computeIfAbsent(key, itemIndex ->
                Bucket.builder()
                        .addLimit(Bandwidth.classic(
                                limit,
                                Refill.greedy(limit, Duration.ofSeconds(windowSeconds))
                        ))
                        .build()
        );

        if (bucket.tryConsume(1)) {
            return 0L;
        }

        // Blocked — how long until the next token arrives?
        ConsumptionProbe probe = bucket.estimateAbilityToConsume(1);
        long nanos = probe.getNanosToWaitForRefill();
        // Round up to the nearest second, minimum 1
        return Math.max(1L, (nanos + 999_999_999L) / 1_000_000_000L);
    }

    /** Approximate number of tracked buckets (for metrics/debugging). */
    public int size() {
        return buckets.size();
    }

    @Scheduled(fixedDelay = 1_800_000L, initialDelay = 1_800_000L)
    public void cleanup() {
        int before = buckets.size();
        buckets.entrySet().removeIf(bucketValue -> {
            try {
                long available = bucketValue.getValue().getAvailableTokens();
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