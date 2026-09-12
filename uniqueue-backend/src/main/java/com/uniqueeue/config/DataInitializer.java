package com.uniqueeue.config;

import com.uniqueeue.enums.Role;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUniversities();
        seedAdmin();
        seedSuperAdmin();
    }

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

    private void seedAdmin() {
        String email = "admin@unilag.edu.ng";
        if (userRepository.findByEmail(email).isPresent()) {
            log.info("Admin user already exists. Skipping.");
            return;
        }
        University unilag = universityRepository.findByCode("UNILAG")
                .orElseThrow(() -> new IllegalStateException("UNILAG missing"));

        userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("admin1234"))
                .fullName("UNILAG Admin")
                .role(Role.ADMIN)
                .university(unilag)
                .isActive(true).isVerified(true).build());

        log.info("✅ Seeded admin user: {} / admin1234", email);
    }

    private void seedSuperAdmin() {
        String email = "superadmin@uniqueue.com";
        if (userRepository.findByEmail(email).isPresent()) {
            log.info("Super Admin already exists. Skipping.");
            return;
        }
        userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("super1234"))
                .fullName("Super Admin")
                .role(Role.SUPER_ADMIN)
                .isActive(true).isVerified(true).build());

        log.info("✅ Seeded SUPER ADMIN: {} / super1234", email);
    }
}