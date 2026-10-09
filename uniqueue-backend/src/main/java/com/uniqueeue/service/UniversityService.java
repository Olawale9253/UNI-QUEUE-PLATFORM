package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateAdminRequest;
import com.uniqueeue.dto.request.CreateUniversityRequest;
import com.uniqueeue.dto.request.UpdateFeaturesRequest;
import com.uniqueeue.dto.request.UpdatePlanRequest;
import com.uniqueeue.dto.request.UpdateUniversityRequest;
import com.uniqueeue.dto.response.UniversityResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.PlanConfig;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UniversityService {

    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final QueueRepository queueRepository;
    private final TicketRepository ticketRepository;
    private final QueueStaffRepository queueStaffRepository;
    private final FeedbackRepository feedbackRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final PlanConfigRepository planConfigRepository;
    private final UniversityStarterPackService starterPackService;   // ⬅ NEW

    @Transactional(readOnly = true)
    public List<UniversityResponse> listAll() {
        return universityRepository.findAll().stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public UniversityResponse getById(Long id) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        return enrich(u);
    }

    // ============================================================
    //  CREATE
    // ============================================================

    @Transactional
    public UniversityResponse create(CreateUniversityRequest request) {
        String code = request.getCode().toUpperCase();
        if (universityRepository.existsByCode(code)) {
            throw new BadRequestException("University code '" + code + "' already exists");
        }
        if (userRepository.existsByEmail(request.getAdminEmail().toLowerCase())) {
            throw new BadRequestException("Admin email is already registered");
        }

        University university = University.builder()
                .name(request.getName())
                .code(code)
                .emailDomain(request.getEmailDomain())
                .matricPattern(request.getMatricPattern())
                .matricExample(request.getMatricExample())
                .matricDescription(request.getMatricDescription())
                .logoUrl(request.getLogoUrl())
                .campusImageUrl(request.getCampusImageUrl())
                .tagline(request.getTagline())
                .primaryColor(request.getPrimaryColor() != null ? request.getPrimaryColor() : "#3B82F6")
                .plan(request.getPlan() != null ? request.getPlan() : "FREE")
                .maxStaff(request.getMaxStaff() != null ? request.getMaxStaff() : 10)
                .maxQueues(request.getMaxQueues() != null ? request.getMaxQueues() : 5)
                .isActive(true)
                .build();

        university = universityRepository.save(university);

        User admin = User.builder()
                .email(request.getAdminEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .fullName(request.getAdminFullName())
                .role(Role.ADMIN)
                .university(university)
                .isActive(true)
                .isVerified(true)
                .build();
        userRepository.save(admin);

        auditService.record(null, university.getId(),
                AuditAction.UNIVERSITY_CREATED, "University", university.getId(),
                "{\"code\":\"" + code + "\",\"adminEmail\":\"" + request.getAdminEmail() + "\"}");

        // ─── Starter pack ───
        // Auto-seed standard offices, services, and workflows so the admin
        // has a working university from minute one.
        // Failures here must NOT roll back the university creation.
        try {
            var result = starterPackService.seed(
                    university.getId(),
                    admin.getId(),
                    true,   // includeOffices
                    true,   // includeServices
                    true    // includeWorkflows
            );
            log.info("Starter pack auto-seeded for university {} — offices={}, services={}, workflows={}",
                    code, result.officesCreated(), result.servicesCreated(), result.workflowsCreated());
        } catch (Exception e) {
            // Non-fatal: the university is registered; the admin can seed manually later
            log.warn("Starter pack seeding failed for new university {}: {}", code, e.getMessage());
        }

        return enrich(university);
    }

    // ============================================================
    //  UPDATE
    // ============================================================

    @Transactional
    public UniversityResponse update(Long id, UpdateUniversityRequest request) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (request.getName() != null) u.setName(request.getName());
        if (request.getEmailDomain() != null) u.setEmailDomain(request.getEmailDomain());
        if (request.getMatricPattern() != null) u.setMatricPattern(request.getMatricPattern());
        if (request.getMatricExample() != null) u.setMatricExample(request.getMatricExample());
        if (request.getMatricDescription() != null) u.setMatricDescription(request.getMatricDescription());
        if (request.getLogoUrl() != null) u.setLogoUrl(request.getLogoUrl());
        if (request.getCampusImageUrl() != null) u.setCampusImageUrl(request.getCampusImageUrl());
        if (request.getTagline() != null) u.setTagline(request.getTagline());
        if (request.getPrimaryColor() != null) u.setPrimaryColor(request.getPrimaryColor());
        if (request.getTimezone() != null) {
            u.setTimezone(request.getTimezone().trim());
        }
        if (request.getPlan() != null) u.setPlan(request.getPlan());
        if (request.getMaxStaff() != null) u.setMaxStaff(request.getMaxStaff());
        if (request.getMaxQueues() != null) u.setMaxQueues(request.getMaxQueues());
        if (request.getIsActive() != null) u.setIsActive(request.getIsActive());

        University saved = universityRepository.save(u);

        auditService.record(null, id, AuditAction.UNIVERSITY_UPDATED, "University", id, null);
        return enrich(saved);
    }

    // ============================================================
    //  DEACTIVATE / REACTIVATE
    // ============================================================

    @Transactional
    public UniversityResponse deactivate(Long id) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        u.setIsActive(false);
        University saved = universityRepository.save(u);

        auditService.record(null, id, AuditAction.UNIVERSITY_DEACTIVATED, "University", id,
                "{\"code\":\"" + u.getCode() + "\"}");

        return enrich(saved);
    }

    @Transactional
    public UniversityResponse reactivate(Long id) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        u.setIsActive(true);
        University saved = universityRepository.save(u);

        auditService.record(null, id, AuditAction.UNIVERSITY_REACTIVATED, "University", id, null);
        return enrich(saved);
    }

    // ============================================================
    //  DELETE — destructive, cascades all data
    // ============================================================

    @Transactional
    public void delete(Long id) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        String code = u.getCode();
        String name = u.getName();

        // 1. Delete all queues' tickets + feedback + queue staff
        List<Queue> queues = queueRepository.findByUniversityId(id);
        for (Queue q : queues) {
            List<Ticket> tickets = ticketRepository.findByQueueId(q.getId());
            for (Ticket t : tickets) {
                feedbackRepository.deleteAll(feedbackRepository.findByTicketId(t.getId()));
            }
            ticketRepository.deleteAll(tickets);
            queueStaffRepository.deleteAll(queueStaffRepository.findByQueueId(q.getId()));
        }

        // 2. Delete queues
        queueRepository.deleteAll(queues);

        // 3. Delete users + their notifications
        List<User> users = userRepository.findByUniversityId(id);
        for (User user : users) {
            notificationRepository.deleteAll(notificationRepository.findByUserId(user.getId()));
        }
        userRepository.deleteAll(users);

        // 4. Delete university
        universityRepository.delete(u);

        // 5. Audit
        auditService.record(null, null, AuditAction.UNIVERSITY_DELETED,
                "University", id,
                "{\"code\":\"" + code + "\",\"name\":\"" + name + "\"}");

        log.info("Deleted university {} ({}) and all associated data", code, id);
    }

    // ============================================================
    //  FEATURE FLAGS
    // ============================================================

    @Transactional
    public UniversityResponse updateFeatures(Long id, UpdateFeaturesRequest request) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (request.getFeatureWaitlist() != null) u.setFeatureWaitlist(request.getFeatureWaitlist());
        if (request.getFeatureAppointments() != null) u.setFeatureAppointments(request.getFeatureAppointments());
        if (request.getFeatureWorkflows() != null) u.setFeatureWorkflows(request.getFeatureWorkflows());
        if (request.getFeatureDocuments() != null) u.setFeatureDocuments(request.getFeatureDocuments());

        University saved = universityRepository.save(u);
        auditService.record(null, id,
                AuditAction.UNIVERSITY_UPDATED,
                "University", id,
                "{\"source\":\"super-admin-features\"}");

        return enrich(saved);
    }

    // ============================================================
    //  PLAN MANAGEMENT
    // ============================================================

    @Transactional
    public UniversityResponse updatePlan(Long id, UpdatePlanRequest request) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        String plan = request.getPlan().toUpperCase();

        PlanConfig config = planConfigRepository.findByCode(plan)
                .orElseThrow(() -> new BadRequestException("Unknown plan: " + plan));

        u.setPlan(plan);
        u.setMaxQueues(config.getMaxQueues());
        u.setMaxStaff(config.getMaxStaff());
        u.setMaxTicketsPerDay(config.getMaxTicketsPerDay());

        University saved = universityRepository.save(u);

        auditService.record(null, id,
                AuditAction.UNIVERSITY_UPDATED,
                "University", id,
                "{\"source\":\"super-admin-plan\",\"plan\":\"" + plan + "\"}");

        return enrich(saved);
    }

    public record PlanLimits(int maxQueues, int maxStaff, int maxTicketsPerDay) {
        public static PlanLimits forPlan(String plan) {
            return switch (plan == null ? "FREE" : plan.toUpperCase()) {
                case "BASIC" -> new PlanLimits(15, 30, 1000);
                case "PREMIUM" -> new PlanLimits(50, 100, 5000);
                case "ENTERPRISE" -> new PlanLimits(500, 1000, 50000);
                default -> new PlanLimits(5, 10, 200);
            };
        }
    }

    // ============================================================
    //  ADMINS
    // ============================================================

    @Transactional
    public UniversityResponse createAdmin(Long universityId, CreateAdminRequest request) {
        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("Email already in use");
        }

        User admin = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.ADMIN)
                .university(university)
                .department(request.getDepartment())
                .phone(request.getPhone())
                .isActive(true)
                .isVerified(true)
                .build();
        userRepository.save(admin);

        auditService.record(null, universityId, AuditAction.ADMIN_CREATED, "User", admin.getId(),
                "{\"email\":\"" + request.getEmail() + "\"}");

        return enrich(university);
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private UniversityResponse enrich(University u) {
        UniversityResponse response = UniversityResponse.from(u);
        response.setQueueCount(queueRepository.countByUniversityId(u.getId()));
        response.setStaffCount((long) userRepository.findByUniversityIdAndRole(u.getId(), Role.STAFF).size());
        response.setUserCount((long) userRepository.findByUniversityIdAndRole(u.getId(), Role.USER).size());
        response.setTicketCount(ticketRepository.countByUniversity(u.getId()));
        return response;
    }
}