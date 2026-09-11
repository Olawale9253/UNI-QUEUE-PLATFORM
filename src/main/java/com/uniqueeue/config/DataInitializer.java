package com.uniqueeue.config;

import com.uniqueeue.model.University;
import com.uniqueeue.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UniversityRepository universityRepository;

    @Override
    public void run(String... args) {
        if (universityRepository.count() > 0) {
            log.info("Universities already seeded. Skipping.");
            return;
        }

        University unilag = University.builder()
                .name("University of Lagos")
                .code("UNILAG")
                .emailDomain("@unilag.edu.ng")
                .matricPattern("^\\d{2}/\\d{5}/\\d{3}$")
                .matricExample("21/12345/001")
                .matricDescription("YY/XXXXX/XXX")
                .build();

        University ui = University.builder()
                .name("University of Ibadan")
                .code("UI")
                .emailDomain("@ui.edu.ng")
                .matricPattern("^\\d{6}$")
                .matricExample("123456")
                .matricDescription("XXXXXX (6 digits)")
                .build();

        University oau = University.builder()
                .name("Obafemi Awolowo University")
                .code("OAU")
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
}