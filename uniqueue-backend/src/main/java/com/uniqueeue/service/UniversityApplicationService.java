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

    @Transactional
    public UniversityApplicationResponse submit(SubmitUniversityApplicationRequest request) {
        String code = request.getUniversityCode().trim().toUpperCase();
        String adminEmail = request.getAdminEmail().trim().toLowerCase();

        if (universityRepository.existsByCode(code)) {
            throw new BadRequestException("A university with code '" + code + "' already exists.");
        }
        if (applicationRepository.existsByUniversityCodeAndStatus(code, UniversityApplication.Status.PENDING)) {
            throw new BadRequestException("We already have a pending application for '" + code + "'.");
        }
        if (applicationRepository.findByAdminEmailAndStatus(adminEmail, UniversityApplication.Status.PENDING).isPresent()) {
            throw new BadRequestException("You already have a pending application. We'll be in touch.");
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

        return UniversityApplicationResponse.from(applicationRepository.save(app));
    }

    @Transactional(readOnly = true)
    public Page<UniversityApplicationResponse> list(UniversityApplication.Status status, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<UniversityApplication> result = status != null
                ? applicationRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : applicationRepository.findAllByOrderByCreatedAtDesc(pageable);
        return result.map(UniversityApplicationResponse::from);
    }

    @Transactional
    public UniversityApplicationResponse approve(Long id, Long superAdminUserId) {
        UniversityApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (app.getStatus() != UniversityApplication.Status.PENDING) {
            throw new BadRequestException("This application has already been reviewed.");
        }

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
            log.info("✅ University '{}' created. Setup email triggered inside create().", app.getUniversityCode());
        } catch (Exception ex) {
            log.error("❌ Failed to create university from application {}: {}", id, ex.getMessage(), ex);
            throw new BadRequestException("Could not create university: " + ex.getMessage());
        }

        // Backup: send password reset email if the setup email failed
        try {
            authService.requestPasswordReset(app.getAdminEmail());
            log.info("📧 Backup password reset email also sent to {}", app.getAdminEmail());
        } catch (Exception ex) {
            log.warn("⚠️ Backup email failed for {}: {}", app.getAdminEmail(), ex.getMessage());
        }

        app.setStatus(UniversityApplication.Status.APPROVED);
        app.setReviewedAt(LocalDateTime.now());
        applicationRepository.save(app);

        if (created != null) {
            auditService.record(superAdminUserId, created.getId(), AuditAction.UNIVERSITY_CREATED, "University", created.getId(), "{\"source\":\"university-application\"}");
        }

        return UniversityApplicationResponse.from(app);
    }

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
        return UniversityApplicationResponse.from(applicationRepository.save(app));
    }

    private String trimToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}