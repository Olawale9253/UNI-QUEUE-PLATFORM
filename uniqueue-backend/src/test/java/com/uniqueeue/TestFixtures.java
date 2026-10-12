package com.uniqueeue;

import com.uniqueeue.enums.Role;
import com.uniqueeue.model.*;
import com.uniqueeue.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

@Component
@RequiredArgsConstructor
public class TestFixtures {

    public static final String PASSWORD = "Password123";

    private final UniversityRepository universityRepository;
    private final OfficeRepository officeRepository;
    private final QueueRepository queueRepository;
    private final UserRepository userRepository;
    private final QueueStaffRepository queueStaffRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final PasswordEncoder passwordEncoder;

    public Fixture build() {
        University uni = universityRepository.save(University.builder()
                .name("Test University")
                .code("TESTUNI")
                .emailDomain("@testuni.edu")
                .primaryColor("#4f46e5")
                .build());

        Office office = officeRepository.save(Office.builder()
                .university(uni)
                .name("Bursary")
                .location("Main Campus")
                .isActive(true)
                .build());

        Queue pay = queueRepository.save(Queue.builder()
                .university(uni)
                .office(office)
                .name("Payment Clearance")
                .opensAt(LocalTime.of(0, 0))
                .closesAt(LocalTime.of(23, 59))
                .maxCapacity(50)
                .averageServiceMinutes(5)
                .allowWaitlist(true)
                .autoPromoteWaitlist(true)
                .maxWaitlistSize(20)
                .matricRequired(false)
                .operatingDays("1,2,3,4,5,6,7")
                .isActive(true)
                .build());

        Queue reg = queueRepository.save(Queue.builder()
                .university(uni)
                .office(office)
                .name("Department Registration")
                .opensAt(LocalTime.of(0, 0))
                .closesAt(LocalTime.of(23, 59))
                .maxCapacity(50)
                .averageServiceMinutes(5)
                .allowWaitlist(true)
                .autoPromoteWaitlist(true)
                .maxWaitlistSize(20)
                .matricRequired(false)
                .operatingDays("1,2,3,4,5,6,7")
                .isActive(true)
                .build());

        User admin = userRepository.save(User.builder()
                .email("admin@testuni.edu")
                .password(passwordEncoder.encode(PASSWORD))
                .fullName("Test Admin")
                .role(Role.ADMIN)
                .university(uni)
                .isActive(true)
                .isVerified(true)
                .build());

        User staff = userRepository.save(User.builder()
                .email("staff@testuni.edu")
                .password(passwordEncoder.encode(PASSWORD))
                .fullName("Test Staff")
                .role(Role.STAFF)
                .university(uni)
                .isActive(true)
                .isVerified(true)
                .build());

        User student = userRepository.save(User.builder()
                .email("student@testuni.edu")
                .password(passwordEncoder.encode(PASSWORD))
                .fullName("Test Student")
                .role(Role.USER)
                .university(uni)
                .isActive(true)
                .isVerified(true)
                .build());

        queueStaffRepository.save(QueueStaff.builder().queue(pay).user(staff).build());
        queueStaffRepository.save(QueueStaff.builder().queue(reg).user(staff).build());

        return new Fixture(uni, office, pay, reg, admin, staff, student);
    }

    /**
     * Builds on {@link #build()} and adds a 2-step workflow:
     *   step 1 = Bursary Payment (pay queue)
     *   step 2 = Department Registration (reg queue)
     */
    public WorkflowFixture buildWithWorkflow() {
        Fixture base = build();

        Workflow wf = workflowRepository.save(Workflow.builder()
                .university(base.university())
                .name("Fresher Clearance")
                .description("Two-step fresher clearance")
                .session("2026/2027")
                .isActive(true)
                .createdBy(base.admin())
                .build());

        WorkflowStep step1 = workflowStepRepository.save(WorkflowStep.builder()
                .workflow(wf)
                .queue(base.payQueue())
                .stepOrder(1)
                .label("Bursary Payment")
                .isRequired(true)
                .build());

        WorkflowStep step2 = workflowStepRepository.save(WorkflowStep.builder()
                .workflow(wf)
                .queue(base.regQueue())
                .stepOrder(2)
                .label("Department Registration")
                .isRequired(true)
                .build());

        return new WorkflowFixture(base, wf, step1, step2);
    }

    public record Fixture(
            University university,
            Office office,
            Queue payQueue,
            Queue regQueue,
            User admin,
            User staff,
            User student
    ) {}

    public record WorkflowFixture(
            Fixture base,
            Workflow workflow,
            WorkflowStep step1,
            WorkflowStep step2
    ) {}
}