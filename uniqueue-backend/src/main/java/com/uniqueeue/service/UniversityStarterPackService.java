package com.uniqueeue.service;

import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.Role;
import com.uniqueeue.model.Office;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.model.Workflow;
import com.uniqueeue.model.WorkflowStep;
import com.uniqueeue.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.*;

/**
 * Seeds a new university with:
 *   - Standard offices (Bursary, Registry, Library, ...)
 *   - Standard services (queues) under each office
 *   - Pre-built workflows that chain those services
 *
 * All three steps are optional — the caller picks what to import.
 * The operation is idempotent: running it twice will not duplicate anything.
 * Existing offices/services/workflows are left untouched.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UniversityStarterPackService {

    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final OfficeRepository officeRepository;
    private final QueueRepository queueRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final AuditService auditService;

    // ============================================================
    //  Public API
    // ============================================================

    @Transactional
    public StarterPackResult seed(Long universityId,
                                  Long adminUserId,
                                  boolean includeOffices,
                                  boolean includeServices,
                                  boolean includeWorkflows) {

        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new RuntimeException("University not found"));

        User admin = adminUserId != null
                ? userRepository.findById(adminUserId).orElse(null)
                : userRepository.findByUniversityIdAndRole(universityId, Role.ADMIN)
                .stream().findFirst().orElse(null);

        int officesCreated = 0;
        int servicesCreated = 0;
        int workflowsCreated = 0;

        // ─── 1. Offices ───
        Map<String, Office> officesByName = new HashMap<>();
        // Always load existing offices first so services can attach to them
        officeRepository.findByUniversityIdOrderByNameAsc(universityId)
                .forEach(officeValue3 -> officesByName.put(officeValue3.getName().toLowerCase(), officeValue3));

        if (includeOffices) {
            for (OfficeTemplate tmpl : OFFICE_TEMPLATES) {
                String key = tmpl.name.toLowerCase();
                if (officesByName.containsKey(key)) continue;

                Office office = Office.builder()
                        .university(university)
                        .name(tmpl.name)
                        .location(tmpl.location)
                        .description(tmpl.description)
                        .openingTime(LocalTime.of(8, 0))
                        .closingTime(LocalTime.of(17, 0))
                        .slotDurationMinutes(30)
                        .isActive(true)
                        .build();
                office = officeRepository.save(office);
                officesByName.put(key, office);
                officesCreated++;
            }
        }

        // ─── 2. Services (queues) ───
        Map<String, Queue> queuesByName = new HashMap<>();
        queueRepository.findByUniversityId(universityId)
                .forEach(queueValue6 -> queuesByName.put(queueValue6.getName().toLowerCase(), queueValue6));

        if (includeServices) {
            for (ServiceTemplate tmpl : SERVICE_TEMPLATES) {
                String key = tmpl.name.toLowerCase();
                if (queuesByName.containsKey(key)) continue;

                Office office = officesByName.get(tmpl.officeName.toLowerCase());
                if (office == null) {
                    log.warn("Skipping service '{}' — office '{}' not found", tmpl.name, tmpl.officeName);
                    continue;
                }

                Queue queue = Queue.builder()
                        .university(university)
                        .office(office)
                        .name(tmpl.name)
                        .description(tmpl.description)
                        .department(office.getName())
                        .location(office.getLocation())
                        .opensAt(LocalTime.of(8, 0))
                        .closesAt(LocalTime.of(17, 0))
                        .maxCapacity(100)
                        .averageServiceMinutes(tmpl.avgMinutes)
                        .allowWaitlist(true)
                        .autoPromoteWaitlist(true)
                        .maxWaitlistSize(50)
                        .matricRequired(tmpl.matricRequired)
                        .operatingDays("1,2,3,4,5")
                        .isActive(true)
                        .createdBy(admin)
                        .build();
                queue = queueRepository.save(queue);
                queuesByName.put(key, queue);
                servicesCreated++;
            }
        }

        // ─── 3. Workflows ───
        if (includeWorkflows) {
            for (WorkflowTemplate tmpl : WORKFLOW_TEMPLATES) {
                // Idempotent: skip if a workflow with same name + session exists
                if (workflowRepository.existsByUniversityIdAndNameIgnoreCaseAndSession(
                        universityId, tmpl.name, tmpl.session)) {
                    continue;
                }

                // Resolve every queue referenced by the template
                List<Queue> resolvedSteps = new ArrayList<>();
                boolean allFound = true;
                for (String qName : tmpl.stepQueueNames) {
                    Queue queueValue7 = queuesByName.get(qName.toLowerCase());
                    if (queueValue7 == null) {
                        log.warn("Skipping workflow '{}' — required queue '{}' not found",
                                tmpl.name, qName);
                        allFound = false;
                        break;
                    }
                    resolvedSteps.add(queueValue7);
                }
                if (!allFound) continue;

                Workflow workflow = Workflow.builder()
                        .university(university)
                        .name(tmpl.name)
                        .description(tmpl.description)
                        .session(tmpl.session)
                        .isActive(true)
                        .createdBy(admin)
                        .build();
                workflow = workflowRepository.save(workflow);

                for (int indexValue10 = 0; indexValue10 < resolvedSteps.size(); indexValue10++) {
                    WorkflowStep step = WorkflowStep.builder()
                            .workflow(workflow)
                            .queue(resolvedSteps.get(indexValue10))
                            .stepOrder(indexValue10 + 1)
                            .label(tmpl.stepLabels.get(indexValue10))
                            .isRequired(true)
                            .build();
                    workflowStepRepository.save(step);
                }
                workflowsCreated++;
            }
        }

        auditService.record(adminUserId, universityId,
                AuditAction.UNIVERSITY_UPDATED, "University", universityId,
                "{\"source\":\"starter-pack\",\"offices\":" + officesCreated
                        + ",\"services\":" + servicesCreated
                        + ",\"workflows\":" + workflowsCreated + "}");

        log.info("Starter pack seeded for university {} — offices={}, services={}, workflows={}",
                university.getCode(), officesCreated, servicesCreated, workflowsCreated);

        return new StarterPackResult(officesCreated, servicesCreated, workflowsCreated);
    }

    // ============================================================
    //  Templates
    // ============================================================

    private record OfficeTemplate(String name, String location, String description) {}

    private static final List<OfficeTemplate> OFFICE_TEMPLATES = List.of(
            new OfficeTemplate("Bursary", "Block A, Room 101",
                    "Payments, fee clearance, and financial services"),
            new OfficeTemplate("Registry", "Admin Block, Room 5",
                    "Transcripts, ID cards, and student records"),
            new OfficeTemplate("Library", "Main Library, Ground Floor",
                    "Library clearance and book returns"),
            new OfficeTemplate("Department Office", "Faculty Building",
                    "Course advising and department registration"),
            new OfficeTemplate("Faculty Office", "Faculty Building, Top Floor",
                    "Faculty approval and result verification"),
            new OfficeTemplate("Hostel Office", "Hostel Admin Block",
                    "Hostel applications, room allocation, and key collection"),
            new OfficeTemplate("Clinic", "Health Center",
                    "Medical screening and health services"),
            new OfficeTemplate("ICT Center", "ICT Building",
                    "Portal support and account services")
    );

    private record ServiceTemplate(
            String name,
            String officeName,
            String description,
            int avgMinutes,
            boolean matricRequired
    ) {}

    private static final List<ServiceTemplate> SERVICE_TEMPLATES = List.of(
            new ServiceTemplate("Tuition Payment", "Bursary",
                    "Pay tuition fees for the session", 5, true),
            new ServiceTemplate("Fee Clearance", "Bursary",
                    "Obtain fee clearance for registration", 4, true),
            new ServiceTemplate("Refund Request", "Bursary",
                    "Request a refund for overpaid fees", 8, true),

            new ServiceTemplate("Transcript Request", "Registry",
                    "Request official academic transcript", 10, true),
            new ServiceTemplate("ID Card Collection", "Registry",
                    "Collect your student ID card", 3, true),
            new ServiceTemplate("Matriculation", "Registry",
                    "Matriculation number issuance", 5, true),

            new ServiceTemplate("Library Clearance", "Library",
                    "Clear library dues and return books", 4, true),
            new ServiceTemplate("Book Return", "Library",
                    "Return borrowed books", 2, true),

            new ServiceTemplate("Department Registration", "Department Office",
                    "Register with your department", 6, true),
            new ServiceTemplate("Course Advising", "Department Office",
                    "Get your courses approved by an adviser", 8, true),

            new ServiceTemplate("Faculty Approval", "Faculty Office",
                    "Faculty-level approval and verification", 5, true),
            new ServiceTemplate("Result Verification", "Faculty Office",
                    "Verify your semester results", 5, true),

            new ServiceTemplate("Hostel Application", "Hostel Office",
                    "Apply for hostel accommodation", 7, true),
            new ServiceTemplate("Room Allocation", "Hostel Office",
                    "Get your hostel room assigned", 5, true),
            new ServiceTemplate("Key Collection", "Hostel Office",
                    "Collect your room key", 2, true),

            new ServiceTemplate("Medical Screening", "Clinic",
                    "Pre-registration medical check", 10, false),

            new ServiceTemplate("Portal Support", "ICT Center",
                    "Help with the student portal", 8, false),
            new ServiceTemplate("Password Reset", "ICT Center",
                    "Reset your student portal password", 3, false)
    );

    private record WorkflowTemplate(
            String name,
            String session,
            String description,
            List<String> stepQueueNames,
            List<String> stepLabels
    ) {}

    private static final List<WorkflowTemplate> WORKFLOW_TEMPLATES = List.of(
            new WorkflowTemplate(
                    "Fresher Registration Clearance",
                    "2026/2027",
                    "Complete each step in order to finish your registration.",
                    List.of("Tuition Payment", "Department Registration",
                            "Faculty Approval", "ID Card Collection", "Hostel Application"),
                    List.of("Bursary Payment", "Department Registration",
                            "Faculty Approval", "ID Card Collection", "Hostel Allocation")
            ),
            new WorkflowTemplate(
                    "Graduation Clearance",
                    "2026/2027",
                    "Clear all departments before collecting your certificate.",
                    List.of("Library Clearance", "Fee Clearance",
                            "Department Registration", "Faculty Approval", "Transcript Request"),
                    List.of("Library Clearance", "Bursary Clearance",
                            "Department Clearance", "Faculty Clearance", "Alumni Registration")
            ),
            new WorkflowTemplate(
                    "Transfer Student Clearance",
                    "2026/2027",
                    "For students transferring into the university.",
                    List.of("Matriculation", "Department Registration",
                            "Tuition Payment", "Faculty Approval", "ID Card Collection"),
                    List.of("Admissions", "Department Registration",
                            "Bursary Payment", "Faculty Approval", "Registry")
            ),
            new WorkflowTemplate(
                    "Semester Registration",
                    "2026/2027",
                    "Register for the new semester.",
                    List.of("Tuition Payment", "Course Advising",
                            "Department Registration", "Faculty Approval"),
                    List.of("Bursary Payment", "Course Advising",
                            "Department Registration", "Faculty Approval")
            ),
            new WorkflowTemplate(
                    "Hostel Allocation",
                    "2026/2027",
                    "Apply and get assigned to a hostel room.",
                    List.of("Hostel Application", "Room Allocation", "Key Collection"),
                    List.of("Application", "Room Allocation", "Key Collection")
            )
    );

    // ============================================================
    //  Result DTO
    // ============================================================

    public record StarterPackResult(int officesCreated, int servicesCreated, int workflowsCreated) {}
}