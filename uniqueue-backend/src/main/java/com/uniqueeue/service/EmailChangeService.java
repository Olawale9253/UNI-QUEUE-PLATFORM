package com.uniqueeue.service;

import com.uniqueeue.dto.request.EmailChangeRequest;
import com.uniqueeue.dto.request.EmailChangeVerifyRequest;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailChangeService {

    private static final int CODE_TTL_MINUTES = 15;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    /**
     * Step 1 — validate password, check the new email is available,
     * generate a code, and (in dev) return it.
     */
    @Transactional
    public String requestChange(Long userId, EmailChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String newEmail = request.getNewEmail().toLowerCase().trim();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Password is incorrect");
        }
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new BadRequestException("New email is the same as your current email");
        }
        if (userRepository.existsByEmail(newEmail)) {
            throw new BadRequestException("This email is already registered to another account");
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        user.setPendingEmail(newEmail);
        user.setPendingEmailCode(code);
        user.setPendingEmailExpiresAt(LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES));
        userRepository.save(user);

        // TODO: send via EmailService when SMTP is wired up.
        // For now: log it (dev) and return it to the caller.
        log.info("📧 Email change code for {} → {}: {}",
                user.getEmail(), newEmail, code);

        auditService.record(userId,
                user.getUniversity() != null ? user.getUniversity().getId() : null,
                AuditAction.EMAIL_CHANGE_REQUESTED, "User", userId,
                "{\"newEmail\":\"" + newEmail + "\"}");

        return code;
    }

    /**
     * Step 2 — verify the code, swap the email, save the old one as
     * recovery, and clear the pending state.
     */
    @Transactional
    public User verifyChange(Long userId, EmailChangeVerifyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getPendingEmail() == null || user.getPendingEmailCode() == null) {
            throw new BadRequestException("No pending email change. Please start over.");
        }
        if (user.getPendingEmailExpiresAt() == null
                || user.getPendingEmailExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification code has expired. Please start over.");
        }
        if (!user.getPendingEmailCode().equals(request.getCode().trim())) {
            throw new BadRequestException("Invalid verification code");
        }

        String oldEmail = user.getEmail();
        String newEmail = user.getPendingEmail();

        // Re-check availability (someone could have taken it in between)
        if (userRepository.existsByEmail(newEmail)) {
            throw new BadRequestException("This email has just been registered by someone else");
        }

        user.setEmail(newEmail);

        // Auto-set recovery email to the previous primary if none exists yet
        if (user.getRecoveryEmail() == null || user.getRecoveryEmail().isBlank()) {
            user.setRecoveryEmail(oldEmail);
        }

        // Clear pending state
        user.setPendingEmail(null);
        user.setPendingEmailCode(null);
        user.setPendingEmailExpiresAt(null);

        User saved = userRepository.save(user);

        auditService.record(userId,
                user.getUniversity() != null ? user.getUniversity().getId() : null,
                AuditAction.EMAIL_CHANGED, "User", userId,
                "{\"oldEmail\":\"" + oldEmail + "\",\"newEmail\":\"" + newEmail + "\"}");

        log.info("✅ Email changed for user {}: {} → {}", userId, oldEmail, newEmail);
        return saved;
    }
}