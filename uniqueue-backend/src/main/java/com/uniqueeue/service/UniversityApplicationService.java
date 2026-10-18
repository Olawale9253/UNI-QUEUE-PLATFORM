package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateUniversityRequest;
import com.uniqueeue.dto.request.SubmitUniversityApplicationRequest;
import com.uniqueeue.dto.response.UniversityApplicationResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.University;
import com.uniqueeue.model.UniversityApplication;
import com.uniqueeue.repository.UniversityApplicationRepository;
import com.uniqueeue.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UniversityApplicationService {

    private final UniversityApplicationRepository applicationRepository;
    private final UniversityRepository universityRepository;
    private final UniversityService universityService;
    private final AuthService authService;
    private final AuditService auditService;

    // ═══════════════════════════════════════════════════════════
    //  PUBLIC — submit a request
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public UniversityApplicationResponse submit(SubmitUniversityApplicationRequest request) {

        String code = request.getUniversityCode().trim().toUpperCase();
        String adminEmail = request.getAdminEmail().trim().toLowerCase();

        // Reject if a live university already exists with this code
        if (universityRepository.existsByCode(code)) {
            throw new BadRequestException(
                    "A university with code '" + code + "' already exists on UniQueue.");
        }

        // Reject if there's already a pending application from this code
        if (applicationRepository.existsByUniversityCodeAndStatus(code, UniversityApplication.Status.PENDING)) {
            throw new BadRequestException(
                    "We already have a pending application for '" + code + "'. Our team will reach out soon.");
        }

        // Reject if this admin email already has a pending application
        if (applicationRepository.findByAdminEmailAndStatus(adminEmail, UniversityApplication.Status.PENDING).isPresent()) {
            throw new BadRequestException(
                    "You already have a pending application. We'll be in touch.");
        }

        UniversityApplication app = UniversityApplication.builder()
                .universityName(request.getUniversityName().trim())
                .universityCode(code)
                .emailDomain(trimToNull(request.getEmailDomain()))
                .adminFullName(request.getAdminFullName().trim())
                .adminEmail(adminEmail)
                .adminPhone(trimToNull(request.getAdminPhone()))
                .adminRole(trimToNull(request.getAdminRole()))
                .message(trimToNull(request.getMessage()))
                .status(UniversityApplication.Status.PENDING)
                .build();

        UniversityApplication saved = applicationRepository.save(app);

        log.info("New university application: {} ({}) from {}",
                saved.getUniversityName(), saved.getUniversityCode(), saved.getAdminEmail());

        return UniversityApplicationResponse.from(saved);
    }

    // ═══════════════════════════════════════════════════════════
    //  SUPER ADMIN — list
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Page<UniversityApplicationResponse> list(
            UniversityApplication.Status status, int page, int size) {

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<UniversityApplication> result = status != null
                ? applicationRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : applicationRepository.findAllByOrderByCreatedAtDesc(pageable);

        return result.map(UniversityApplicationResponse::from);
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return applicationRepository.countByStatus(UniversityApplication.Status.PENDING);
    }

    // ═══════════════════════════════════════════════════════════
    //  SUPER ADMIN — approve
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public UniversityApplicationResponse approve(Long id, Long superAdminUserId) {

        UniversityApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (app.getStatus() != UniversityApplication.Status.PENDING) {
            throw new BadRequestException("This application has already been reviewed.");
        }

        // Generate a strong temporary password — the admin will reset it via email
        String tempPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 16) + "!Aa1";

        CreateUniversityRequest createReq = CreateUniversityRequest.builder()
                .name(app.getUniversityName())
                .code(app.getUniversityCode())
                .emailDomain(app.getEmailDomain())
                .adminFullName(app.getAdminFullName())
                .adminEmail(app.getAdminEmail())
                .adminPassword(tempPassword)
                .build();

        University created = null;
        try {
            var response = universityService.create(createReq);
            created = universityRepository.findById(response.getId()).orElse(null);
        } catch (Exception ex) {
            log.error("Failed to create university from application {}: {}", id, ex.getMessage());
            throw new BadRequestException(
                    "Could not create university: " + ex.getMessage());
        }

        // Trigger the password-reset email so the admin can set their own password
        try {
            authService.requestPasswordReset(app.getAdminEmail());
        } catch (Exception ex) {
            log.warn("Admin welcome email failed for {}: {}",
                    app.getAdminEmail(), ex.getMessage());
        }

        app.setStatus(UniversityApplication.Status.APPROVED);
        app.setReviewedAt(LocalDateTime.now());
        app.setRejectionReason(null);
        applicationRepository.save(app);

        auditService.record(superAdminUserId, created != null ? created.getId() : null,
                AuditAction.UNIVERSITY_CREATED, "University", created != null ? created.getId() : null,
                "{\"source\":\"university-application\",\"applicationId\":" + id + "}");

        log.info("Approved university application {} → created university {} ({})",
                id, app.getUniversityCode(), created != null ? created.getId() : null);

        return UniversityApplicationResponse.from(app);
    }

    // ═══════════════════════════════════════════════════════════
    //  SUPER ADMIN — reject
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public UniversityApplicationResponse reject(Long id, String reason) {

        UniversityApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (app.getStatus() != UniversityApplication.Status.PENDING) {
            throw new BadRequestException("This application has already been reviewed.");
        }

        app.setStatus(UniversityApplication.Status.REJECTED);
        app.setRejectionReason(trimToNull(reason));
        app.setReviewedAt(LocalDateTime.now());
        applicationRepository.save(app);

        log.info("Rejected university application {} ({})", id, app.getUniversityCode());
        return UniversityApplicationResponse.from(app);
    }

    // ═══════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════

    private String trimToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}