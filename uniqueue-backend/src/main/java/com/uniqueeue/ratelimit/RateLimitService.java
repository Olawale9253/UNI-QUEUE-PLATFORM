package com.uniqueeue.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class RateLimitService {

    /** Tracks the bucket + last access time so idle buckets can be evicted. */
    private record BucketEntry(Bucket bucket, AtomicLong lastAccessEpochSecond) {}

    private final Map<String, BucketEntry> buckets = new ConcurrentHashMap<>();

    public long tryConsume(String key, int limit, int windowSeconds) {
        long now = Instant.now().getEpochSecond();

        BucketEntry entry = buckets.computeIfAbsent(key, k -> new BucketEntry(
                Bucket.builder()
                        .addLimit(Bandwidth.classic(
                                limit,
                                Refill.greedy(limit, Duration.ofSeconds(windowSeconds))
                        ))
                        .build(),
                new AtomicLong(now)
        ));
        entry.lastAccessEpochSecond().set(now);

        ConsumptionProbe probe = entry.bucket().tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            return 0L;
        }

        long nanos = probe.getNanosToWaitForRefill();
        return Math.max(1L, (nanos + 999_999_999L) / 1_000_000_000L);
    }

    public int size() {
        return buckets.size();
    }

    /**
     * Evicts buckets idle for over 1 hour. Every window is at most 3600s,
     * so a bucket untouched for 1 hour is guaranteed to be fully refilled
     * and safe to remove. Evicting by idle time prevents the unbounded
     * growth that the previous token-count check caused.
     */
    @Scheduled(fixedDelay = 1_800_000L, initialDelay = 1_800_000L)
    public void cleanup() {
        long cutoff = Instant.now().getEpochSecond() - 3600;
        int before = buckets.size();
        buckets.entrySet().removeIf(e -> e.getValue().lastAccessEpochSecond().get() < cutoff);
        int after = buckets.size();
        if (before != after) {
            log.debug("Rate limit cleanup: evicted {} buckets ({} -> {})", before - after, before, after);
        }
    }
}