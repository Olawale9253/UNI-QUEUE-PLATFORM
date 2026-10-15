package com.uniqueeue.config;

import com.uniqueeue.enums.Role;
import com.uniqueeue.model.PlanConfig;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.PlanConfigRepository;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.util.EmailNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final PlanConfigRepository planConfigRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Super admin seed (from env) ───
    @Value("${app.super-admin.email:}")
    private String superAdminEmail;

    @Value("${app.super-admin.password:}")
    private String superAdminPassword;

    // ─── Initial university admin seed (from env) ───
    @Value("${app.seed.admin.email:}")
    private String seedAdminEmail;

    @Value("${app.seed.admin.password:}")
    private String seedAdminPassword;

    @Override
    public void run(String... args) {
        seedPlanConfigs();
        seedUniversities();
        seedAdmin();
        seedSuperAdmin();
    }

    // ═══════════════════════════════════════════════════════════
    //  PLAN CONFIGS
    // ═══════════════════════════════════════════════════════════

    private void seedPlanConfigs() {
        if (planConfigRepository.count() > 0) {
            log.info("Plan configs already seeded. Skipping.");
            return;
        }

        planConfigRepository.save(PlanConfig.builder()
                .code("FREE").label("Free").priceUsd(0.0)
                .maxQueues(5).maxStaff(10).maxTicketsPerDay(200)
                .displayOrder(1).isActive(true).build());

        planConfigRepository.save(PlanConfig.builder()
                .code("BASIC").label("Basic").priceUsd(49.0)
                .maxQueues(15).maxStaff(30).maxTicketsPerDay(1000)
                .displayOrder(2).isActive(true).build());

        planConfigRepository.save(PlanConfig.builder()
                .code("PREMIUM").label("Premium").priceUsd(199.0)
                .maxQueues(50).maxStaff(100).maxTicketsPerDay(5000)
                .displayOrder(3).isActive(true).build());

        planConfigRepository.save(PlanConfig.builder()
                .code("ENTERPRISE").label("Enterprise").priceUsd(799.0)
                .maxQueues(500).maxStaff(1000).maxTicketsPerDay(50000)
                .displayOrder(4).isActive(true).build());

        log.info("✅ Seeded {} plan configs", planConfigRepository.count());
    }

    // ═══════════════════════════════════════════════════════════
    //  UNIVERSITIES
    // ═══════════════════════════════════════════════════════════

    private void seedUniversities() {
        if (universityRepository.count() > 0) {
            log.info("Universities already seeded. Skipping.");
            return;
        }

        University unilag = University.builder()
                .name("University of Lagos").code("UNILAG")
                .emailDomain("@unilag.edu.ng")
                .matricPattern("^\\d{2}/\\d{5}/\\d{3}$")
                .matricExample("21/12345/001")
                .matricDescription("YY/XXXXX/XXX")
                .build();

        University ui = University.builder()
                .name("University of Ibadan").code("UI")
                .emailDomain("@ui.edu.ng")
                .matricPattern("^\\d{6}$")
                .matricExample("123456")
                .matricDescription("XXXXXX (6 digits)")
                .build();

        University oau = University.builder()
                .name("Obafemi Awolowo University").code("OAU")
                .emailDomain("@oau.edu.ng")
                .matricPattern("^[A-Z]{3}/\\d{4}/\\d{3}$")
                .matricExample("ABC/1234/567")
                .matricDescription("XXX/XXXX/XXX")
                .build();

        universityRepository.save(unilag);
        universityRepository.save(ui);
        universityRepository.save(oau);

        log.info("✅ Seeded {} universities", universityRepository.count());
    }

    // ═══════════════════════════════════════════════════════════
    //  ADMIN (env-driven — no more hardcoded password)
    // ═══════════════════════════════════════════════════════════

    private void seedAdmin() {
        if (seedAdminEmail == null || seedAdminEmail.isBlank()) {
            log.info("Admin seed skipped — app.seed.admin.email not set.");
            return;
        }

        if (userRepository.findByEmail(seedAdminEmail).isPresent()) {
            log.info("Admin user already exists. Skipping.");
            return;
        }

        University unilag = universityRepository.findByCode("UNILAG")
                .orElseThrow(() -> new IllegalStateException("UNILAG missing"));

        userRepository.save(User.builder()
                .email(seedAdminEmail)
                .password(passwordEncoder.encode(seedAdminPassword))
                .fullName("UNILAG Admin")
                .role(Role.ADMIN)
                .university(unilag)
                .isActive(true).isVerified(true).build());

        log.info("✅ Seeded admin user: {}", seedAdminEmail);
        // Deliberately NOT logging the password
    }

    // ═══════════════════════════════════════════════════════════
    //  SUPER ADMIN (env-driven)
    // ═══════════════════════════════════════════════════════════

    private void seedSuperAdmin() {
        if (superAdminEmail == null || superAdminEmail.isBlank()) {
            log.info("Super admin seed skipped — app.super-admin.email not set.");
            return;
        }
        if (superAdminPassword == null || superAdminPassword.isBlank()) {
            log.warn("Super admin seed skipped — app.super-admin.password not set.");
            return;
        }

        String email = EmailNormalizer.normalize(superAdminEmail);
        if (email == null) {
            log.warn("Super admin seed skipped — app.super-admin.email is invalid.");
            return;
        }

        var existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User superAdmin = existing.get();
            if (superAdmin.getRole() != Role.SUPER_ADMIN) {
                log.warn("Super admin seed skipped — configured email belongs to a non-super-admin account.");
                return;
            }
            if (!passwordEncoder.matches(superAdminPassword, superAdmin.getPassword())) {
                superAdmin.setPassword(passwordEncoder.encode(superAdminPassword));
                userRepository.save(superAdmin);
                log.info("Super admin password synchronized from configured secret.");
            } else {
                log.info("Super admin already exists with the configured password. Skipping.");
            }
            return;
        }

        userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode(superAdminPassword))
                .fullName("Super Admin")
                .role(Role.SUPER_ADMIN)
                .isActive(true).isVerified(true).build());

        log.info("✅ Seeded SUPER ADMIN: {}", superAdminEmail);
        // Deliberately NOT logging the password
    }
}