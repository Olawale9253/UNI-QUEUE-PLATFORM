package com.uniqueeue.service;

import com.uniqueeue.model.User;
import com.uniqueeue.repository.PasswordResetTokenRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled lifecycle maintenance.
 *
 * Jobs:
 *   1. Purge expired password reset tokens (daily, 03:00)
 *   2. Clear expired verification codes (daily, 03:30)
 *   3. Prune stale unverified accounts (weekly, Sunday 04:00) — opt-in
 *
 * All jobs are idempotent — safe to run manually via service methods.
 * Runs on the "scheduling-1" thread pool (see @EnableScheduling on the main class).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupScheduler {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;

    /**
     * If true, weekly job will DELETE stale unverified accounts.
     * Set to false to only log the count without deleting (safer for early production).
     */
    @Value("${app.cleanup.delete-unverified-accounts:true}")
    private boolean deleteUnverifiedAccounts;

    /** Days after signup before we consider an unverified account stale. */
    @Value("${app.cleanup.unverified-account-age-days:30}")
    private int unverifiedAccountAgeDays;

    // ============================================================
    //  JOB 1 — Password reset tokens
    // ============================================================

    /**
     * Runs daily at 03:00. Purges password reset tokens that expired
     * more than an hour ago. The 1-hour buffer accounts for any in-flight
     * requests where a user is submitting a token right at the boundary.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredPasswordResetTokens() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
        try {
            int deleted = passwordResetTokenRepository.deleteExpiredBefore(cutoff);
            if (deleted > 0) {
                log.info("Cleanup: purged {} expired password reset token(s)", deleted);
            }
        } catch (Exception e) {
            log.error("Cleanup: failed to purge password reset tokens", e);
        }
    }

    // ============================================================
    //  JOB 2 — Expired verification codes
    // ============================================================

    /**
     * Runs daily at 03:30. Clears verification token, attempts counter,
     * and expiry from any unverified user whose code has expired.
     *
     * This does NOT delete the user — just resets their verification state
     * so they can request a fresh code without hitting "invalid code".
     */
    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void clearExpiredVerificationCodes() {
        LocalDateTime cutoff = LocalDateTime.now();
        try {
            int cleared = userRepository.clearExpiredVerificationCodes(cutoff);
            if (cleared > 0) {
                log.info("Cleanup: cleared {} expired verification code(s)", cleared);
            }
        } catch (Exception e) {
            log.error("Cleanup: failed to clear expired verification codes", e);
        }
    }

    // ============================================================
    //  JOB 3 — Stale unverified accounts (opt-in)
    // ============================================================

    /**
     * Runs weekly, Sunday 04:00. By default, DELETES unverified accounts
     * older than {@code unverifiedAccountAgeDays}. Set
     * {@code app.cleanup.delete-unverified-accounts=false} to only log.
     *
     * Why this is safe:
     *   - Only affects accounts that never verified their email.
     *   - No tickets, documents, appointments, or feedback can exist
     *     because those features require a verified session.
     *   - The email becomes available for re-registration.
     */
    @Scheduled(cron = "0 0 4 * * SUN")
    @Transactional
    public void pruneStaleUnverifiedAccounts() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(unverifiedAccountAgeDays);
        try {
            long count = userRepository.countUnverifiedOlderThan(cutoff);

            if (count == 0) {
                return;
            }

            if (!deleteUnverifiedAccounts) {
                log.info("Cleanup: {} stale unverified account(s) older than {}d (delete disabled)",
                        count, unverifiedAccountAgeDays);
                return;
            }

            List<User> stale = userRepository.findUnverifiedOlderThan(cutoff);

            // Safety: skip anyone whose email is not empty but who has been
            // touched within the last week (defensive against clock skew).
            List<User> toDelete = stale.stream()
                    .filter(u -> u.getUpdatedAt() == null
                            || u.getUpdatedAt().isBefore(LocalDateTime.now().minusDays(7)))
                    .toList();

            userRepository.deleteAll(toDelete);

            log.info("Cleanup: pruned {} stale unverified account(s) older than {}d",
                    toDelete.size(), unverifiedAccountAgeDays);

        } catch (Exception e) {
            log.error("Cleanup: failed to prune stale unverified accounts", e);
        }
    }
}