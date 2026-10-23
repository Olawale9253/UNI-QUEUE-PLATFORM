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
import com.uniqueeue.model.*;
import com.uniqueeue.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
    private final UniversityStarterPackService starterPackService;

    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private final OfficeRepository officeRepository;
    private final UniversityClosedDateRepository closedDateRepository;
    private final AdmittedStudentRepository admittedStudentRepository;
    private final StudentRegistryRepository studentRegistryRepository;

    @Transactional(readOnly = true)
    public List<UniversityResponse> listAll() {
        return universityRepository.findAll().stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public UniversityResponse getById(Long id) {
        University universityValue12 = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        return enrich(universityValue12);
    }

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
                .primaryColor(request.getPrimaryColor() != null ? request.getPrimaryColor() : "#1e3a8a")
                .plan(request.getPlan() != null ? request.getPlan() : "FREE")
                .maxStaff(request.getMaxStaff() != null ? request.getMaxStaff() : 10)
                .maxQueues(request.getMaxQueues() != null ? request.getMaxQueues() : 5)
                .isActive(true)
                .build();

        university = universityRepository.save(university);

        User admin = User.builder()
                .email(request.getAdminEmail().toLowerCase())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(request.getAdminFullName())
                .role(Role.ADMIN)
                .university(university)
                .isActive(true)
                .isVerified(true)
                .build();
        userRepository.save(admin);

        String token = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        PasswordResetToken setupToken = PasswordResetToken.builder()
                .token(token)
                .user(admin)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();
        passwordResetTokenRepository.save(setupToken);

        // 🔧 FIX: Wrap synchronous email in try/catch so a failure doesn't roll back university creation
        try {
            emailService.sendAdminSetupEmail(admin, token);
            log.info("✅ Setup email sent to {}", admin.getEmail());
        } catch (Exception ex) {
            log.error("❌ Setup email FAILED for {} — {}", admin.getEmail(), ex.getMessage(), ex);
            // Do NOT rethrow — the university is still created
        }

        auditService.record(null, university.getId(),
                AuditAction.UNIVERSITY_CREATED, "University", university.getId(),
                "{\"code\":\"" + code + "\",\"adminEmail\":\"" + request.getAdminEmail() + "\"}");

        try {
            var result = starterPackService.seed(university.getId(), admin.getId(), true, true, true);
            log.info("Starter pack auto-seeded for university {} — offices={}, services={}, workflows={}",
                    code, result.officesCreated(), result.servicesCreated(), result.workflowsCreated());
        } catch (Exception exceptionValue13) {
            log.warn("Starter pack seeding failed for new university {}: {}", code, exceptionValue13.getMessage());
        }

        return enrich(university);
    }

    @Transactional
    public UniversityResponse update(Long id, UpdateUniversityRequest request) {
        University universityValue13 = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (request.getName() != null) universityValue13.setName(request.getName());
        if (request.getEmailDomain() != null) universityValue13.setEmailDomain(request.getEmailDomain());
        if (request.getMatricPattern() != null) universityValue13.setMatricPattern(request.getMatricPattern());
        if (request.getMatricExample() != null) universityValue13.setMatricExample(request.getMatricExample());
        if (request.getMatricDescription() != null) universityValue13.setMatricDescription(request.getMatricDescription());
        if (request.getLogoUrl() != null) universityValue13.setLogoUrl(request.getLogoUrl());
        if (request.getCampusImageUrl() != null) universityValue13.setCampusImageUrl(request.getCampusImageUrl());
        if (request.getTagline() != null) universityValue13.setTagline(request.getTagline());
        if (request.getPrimaryColor() != null) universityValue13.setPrimaryColor(request.getPrimaryColor());
        if (request.getTimezone() != null) universityValue13.setTimezone(request.getTimezone().trim());
        if (request.getPlan() != null) universityValue13.setPlan(request.getPlan());
        if (request.getMaxStaff() != null) universityValue13.setMaxStaff(request.getMaxStaff());
        if (request.getMaxQueues() != null) universityValue13.setMaxQueues(request.getMaxQueues());
        if (request.getIsActive() != null) universityValue13.setIsActive(request.getIsActive());

        University saved = universityRepository.save(universityValue13);
        auditService.record(null, id, AuditAction.UNIVERSITY_UPDATED, "University", id, null);
        return enrich(saved);
    }

    @Transactional
    public UniversityResponse deactivate(Long id) {
        University universityValue14 = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        universityValue14.setIsActive(false);
        University saved = universityRepository.save(universityValue14);
        auditService.record(null, id, AuditAction.UNIVERSITY_DEACTIVATED, "University", id, "{\"code\":\"" + universityValue14.getCode() + "\"}");
        return enrich(saved);
    }

    @Transactional
    public UniversityResponse reactivate(Long id) {
        University universityValue15 = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        universityValue15.setIsActive(true);
        University saved = universityRepository.save(universityValue15);
        auditService.record(null, id, AuditAction.UNIVERSITY_REACTIVATED, "University", id, null);
        return enrich(saved);
    }

    @Transactional
    public void delete(Long id) {
        University universityValue16 = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        String code = universityValue16.getCode();
        String name = universityValue16.getName();

        List<Queue> queues = queueRepository.findByUniversityId(id);
        for (Queue queueValue5 : queues) {
            List<Ticket> tickets = ticketRepository.findByQueueId(queueValue5.getId());
            for (Ticket ticketValue31 : tickets) {
                feedbackRepository.deleteAll(feedbackRepository.findByTicketId(ticketValue31.getId()));
            }
            ticketRepository.deleteAll(tickets);
            queueStaffRepository.deleteAll(queueStaffRepository.findByQueueId(queueValue5.getId()));
        }
        queueRepository.deleteAll(queues);

        List<Office> offices = officeRepository.findAll().stream()
                .filter(o -> o.getUniversity() != null && o.getUniversity().getId().equals(id))
                .toList();
        officeRepository.deleteAll(offices);

        List<UniversityClosedDate> closedDates = closedDateRepository.findAll().stream()
                .filter(c -> c.getUniversity() != null && c.getUniversity().getId().equals(id))
                .toList();
        closedDateRepository.deleteAll(closedDates);

        List<AdmittedStudent> admittedStudents = admittedStudentRepository.findAll().stream()
                .filter(a -> a.getUniversity() != null && a.getUniversity().getId().equals(id))
                .toList();
        admittedStudentRepository.deleteAll(admittedStudents);

        List<StudentRegistry> studentRegistries = studentRegistryRepository.findAll().stream()
                .filter(s -> s.getUniversity() != null && s.getUniversity().getId().equals(id))
                .toList();
        studentRegistryRepository.deleteAll(studentRegistries);

        List<User> users = userRepository.findByUniversityId(id);
        for (User user : users) {
            notificationRepository.deleteAll(notificationRepository.findByUserId(user.getId()));
        }
        userRepository.deleteAll(users);

        universityRepository.delete(universityValue16);

        auditService.record(null, null, AuditAction.UNIVERSITY_DELETED, "University", id, "{\"code\":\"" + code + "\",\"name\":\"" + name + "\"}");
        log.info("Deleted university {} ({}) and all associated data", code, id);
    }

    @Transactional
    public UniversityResponse updateFeatures(Long id, UpdateFeaturesRequest request) {
        University universityValue17 = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (request.getFeatureWaitlist() != null) universityValue17.setFeatureWaitlist(request.getFeatureWaitlist());
        if (request.getFeatureAppointments() != null) universityValue17.setFeatureAppointments(request.getFeatureAppointments());
        if (request.getFeatureWorkflows() != null) universityValue17.setFeatureWorkflows(request.getFeatureWorkflows());
        if (request.getFeatureDocuments() != null) universityValue17.setFeatureDocuments(request.getFeatureDocuments());

        University saved = universityRepository.save(universityValue17);
        auditService.record(null, id, AuditAction.UNIVERSITY_UPDATED, "University", id, "{\"source\":\"super-admin-features\"}");
        return enrich(saved);
    }

    @Transactional
    public UniversityResponse updatePlan(Long id, UpdatePlanRequest request) {
        University universityValue18 = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        String plan = request.getPlan().toUpperCase();
        PlanConfig config = planConfigRepository.findByCode(plan)
                .orElseThrow(() -> new BadRequestException("Unknown plan: " + plan));

        universityValue18.setPlan(plan);
        universityValue18.setMaxQueues(config.getMaxQueues());
        universityValue18.setMaxStaff(config.getMaxStaff());
        universityValue18.setMaxTicketsPerDay(config.getMaxTicketsPerDay());

        University saved = universityRepository.save(universityValue18);
        auditService.record(null, id, AuditAction.UNIVERSITY_UPDATED, "University", id, "{\"source\":\"super-admin-plan\",\"plan\":\"" + plan + "\"}");
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
        auditService.record(null, universityId, AuditAction.ADMIN_CREATED, "User", admin.getId(), "{\"email\":\"" + request.getEmail() + "\"}");
        return enrich(university);
    }

    private UniversityResponse enrich(University universityValue19) {
        UniversityResponse response = UniversityResponse.from(universityValue19);
        response.setQueueCount(queueRepository.countByUniversityId(universityValue19.getId()));
        response.setStaffCount((long) userRepository.findByUniversityIdAndRole(universityValue19.getId(), Role.STAFF).size());
        response.setUserCount((long) userRepository.findByUniversityIdAndRole(universityValue19.getId(), Role.USER).size());
        response.setTicketCount(ticketRepository.countByUniversity(universityValue19.getId()));
        return response;
    }
}