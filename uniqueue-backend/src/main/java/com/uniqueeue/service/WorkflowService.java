package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateWorkflowRequest;
import com.uniqueeue.dto.request.UpdateWorkflowStepRequest;
import com.uniqueeue.dto.response.StudentWorkflowResponse;
import com.uniqueeue.dto.response.WorkflowProgressResponse;
import com.uniqueeue.dto.response.WorkflowResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.enums.StepStatus;
import com.uniqueeue.enums.WorkflowStatus;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.*;
import com.uniqueeue.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository stepRepository;
    private final StudentWorkflowRepository studentWorkflowRepository;
    private final StudentWorkflowStepRepository studentWorkflowStepRepository;
    private final QueueRepository queueRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    // ============================================================
    //  ADMIN — create & manage workflows
    // ============================================================

    @Transactional
    public WorkflowResponse create(Long adminUserId, Long universityId, CreateWorkflowRequest request) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (request.getSteps() == null || request.getSteps().isEmpty()) {
            throw new BadRequestException("Workflow must have at least one step");
        }

        // ⬇ NEW: reject duplicate (name + session) within the same university
        String cleanName = request.getName() != null ? request.getName().trim() : "";
        String cleanSession = request.getSession() != null ? request.getSession().trim() : null;

        if (workflowRepository.existsByUniversityIdAndNameIgnoreCaseAndSession(
                universityId, cleanName, cleanSession)) {
            throw new BadRequestException(
                    "A workflow named \"" + cleanName + "\" already exists"
                            + (cleanSession != null ? " for session " + cleanSession : "")
                            + ".");
        }

        List<Queue> queues = new ArrayList<>();
        for (CreateWorkflowRequest.StepInput input : request.getSteps()) {
            Queue q = queueRepository.findByIdAndUniversityId(input.getQueueId(), universityId)
                    .orElseThrow(() -> new BadRequestException(
                            "Queue " + input.getQueueId() + " not found in your university"));
            queues.add(q);
        }

        Workflow workflow = Workflow.builder()
                .university(admin.getUniversity())
                .name(cleanName)
                .description(request.getDescription())
                .session(cleanSession)
                .isActive(true)
                .createdBy(admin)
                .build();
        workflow = workflowRepository.save(workflow);

        List<WorkflowStep> steps = new ArrayList<>();
        for (int i = 0; i < request.getSteps().size(); i++) {
            CreateWorkflowRequest.StepInput input = request.getSteps().get(i);
            WorkflowStep step = WorkflowStep.builder()
                    .workflow(workflow)
                    .queue(queues.get(i))
                    .stepOrder(i + 1)
                    .label(input.getLabel())
                    .instructions(input.getInstructions())
                    .isRequired(input.getIsRequired() != null ? input.getIsRequired() : true)
                    .build();
            steps.add(stepRepository.save(step));
        }

        auditService.record(adminUserId, universityId,
                AuditAction.WORKFLOW_CREATED, "Workflow", workflow.getId(),
                "{\"name\":\"" + workflow.getName() + "\",\"steps\":" + steps.size() + "}");

        return WorkflowResponse.from(workflow, steps, 0, 0);
    }

    @Transactional(readOnly = true)
    public List<WorkflowResponse> listForUniversity(Long universityId) {
        return workflowRepository.findByUniversityIdOrderByCreatedAtDesc(universityId).stream()
                .map(w -> {
                    List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(w.getId());
                    long inProgress = studentWorkflowRepository.countByWorkflowIdAndStatus(w.getId(), WorkflowStatus.IN_PROGRESS);
                    long completed = studentWorkflowRepository.countByWorkflowIdAndStatus(w.getId(), WorkflowStatus.COMPLETED);
                    return WorkflowResponse.from(w, steps, inProgress, completed);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkflowResponse getOne(Long workflowId, Long universityId) {
        Workflow w = workflowRepository.findByIdAndUniversityId(workflowId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(w.getId());
        long inProgress = studentWorkflowRepository.countByWorkflowIdAndStatus(w.getId(), WorkflowStatus.IN_PROGRESS);
        long completed = studentWorkflowRepository.countByWorkflowIdAndStatus(w.getId(), WorkflowStatus.COMPLETED);
        return WorkflowResponse.from(w, steps, inProgress, completed);
    }

    @Transactional
    public void delete(Long workflowId, Long universityId) {
        Workflow w = workflowRepository.findByIdAndUniversityId(workflowId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

        long active = studentWorkflowRepository.countByWorkflowIdAndStatus(workflowId, WorkflowStatus.IN_PROGRESS);
        if (active > 0) {
            throw new BadRequestException("Cannot delete — " + active + " student(s) still in progress");
        }

        // Clean up related rows first (order matters for FK constraints)
        List<StudentWorkflow> enrolled = studentWorkflowRepository.findByWorkflowId(workflowId);
        for (StudentWorkflow sw : enrolled) {
            studentWorkflowStepRepository.deleteByStudentWorkflowId(sw.getId());
        }
        studentWorkflowRepository.deleteAll(enrolled);

        stepRepository.deleteByWorkflowId(workflowId);
        workflowRepository.delete(w);

        auditService.record(null, universityId,
                AuditAction.WORKFLOW_DELETED, "Workflow", workflowId,
                "{\"name\":\"" + w.getName() + "\"}");
    }

    @Transactional
    public WorkflowResponse updateStep(Long stepId, Long universityId, UpdateWorkflowStepRequest request) {
        WorkflowStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new ResourceNotFoundException("Step not found"));
        if (!step.getWorkflow().getUniversity().getId().equals(universityId)) {
            throw new ResourceNotFoundException("Step not found");
        }
        if (request.getLabel() != null) step.setLabel(request.getLabel());
        if (request.getInstructions() != null) step.setInstructions(request.getInstructions());
        if (request.getIsRequired() != null) step.setIsRequired(request.getIsRequired());
        stepRepository.save(step);

        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(step.getWorkflow().getId());
        return WorkflowResponse.from(step.getWorkflow(), steps, 0, 0);
    }

    // ============================================================
    //  STUDENT — start & progress
    // ============================================================

    @Transactional(readOnly = true)
    public List<WorkflowResponse> listAvailableForStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        if (student.getUniversity() == null) return List.of();
        return workflowRepository.findByUniversityIdAndIsActiveTrueOrderByCreatedAtDesc(student.getUniversity().getId())
                .stream()
                .map(w -> {
                    List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(w.getId());
                    return WorkflowResponse.from(w, steps, 0, 0);
                })
                .toList();
    }

    @Transactional
    public StudentWorkflowResponse start(Long studentId, Long workflowId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

        if (student.getUniversity() == null
                || !student.getUniversity().getId().equals(workflow.getUniversity().getId())) {
            throw new BadRequestException("Workflow is not in your university");
        }
        if (!Boolean.TRUE.equals(workflow.getIsActive())) {
            throw new BadRequestException("Workflow is not active");
        }
        if (studentWorkflowRepository.findByStudentIdAndWorkflowId(studentId, workflowId).isPresent()) {
            throw new BadRequestException("You've already started this workflow");
        }

        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        if (steps.isEmpty()) {
            throw new BadRequestException("Workflow has no steps");
        }

        StudentWorkflow sw = StudentWorkflow.builder()
                .student(student)
                .workflow(workflow)
                .currentStepOrder(1)
                .status(WorkflowStatus.IN_PROGRESS)
                .build();
        sw = studentWorkflowRepository.save(sw);

        createStepTracking(sw, steps);

        WorkflowStep firstStep = steps.get(0);
        notificationService.notify(student, NotificationType.SYSTEM,
                "Workflow started: " + workflow.getName(),
                "First step: " + stepLabel(firstStep) + ". Join the \"" +
                        firstStep.getQueue().getName() + "\" queue to proceed.");

        auditService.record(studentId, workflow.getUniversity().getId(),
                AuditAction.WORKFLOW_STARTED, "StudentWorkflow", sw.getId(),
                "{\"workflowId\":" + workflowId + "}");

        return StudentWorkflowResponse.from(sw, steps);
    }

    @Transactional(readOnly = true)
    public List<StudentWorkflowResponse> listMine(Long studentId) {
        return studentWorkflowRepository.findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .map(sw -> {
                    List<WorkflowStep> steps = stepRepository
                            .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());
                    ensureStepsExist(sw, steps);
                    return StudentWorkflowResponse.from(sw, steps);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentWorkflowResponse getMine(Long studentId, Long studentWorkflowId) {
        StudentWorkflow sw = studentWorkflowRepository.findById(studentWorkflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (!sw.getStudent().getId().equals(studentId)) {
            throw new ResourceNotFoundException("Not found");
        }
        List<WorkflowStep> steps = stepRepository
                .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());
        ensureStepsExist(sw, steps);
        return StudentWorkflowResponse.from(sw, steps);
    }

    @Transactional
    public void abandon(Long studentId, Long studentWorkflowId) {
        StudentWorkflow sw = studentWorkflowRepository.findById(studentWorkflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (!sw.getStudent().getId().equals(studentId)) {
            throw new ResourceNotFoundException("Not found");
        }
        if (sw.getStatus() != WorkflowStatus.IN_PROGRESS) {
            throw new BadRequestException("Only IN_PROGRESS workflows can be abandoned");
        }
        sw.setStatus(WorkflowStatus.ABANDONED);
        studentWorkflowRepository.save(sw);

        auditService.record(studentId, sw.getWorkflow().getUniversity().getId(),
                AuditAction.WORKFLOW_ABANDONED, "StudentWorkflow", sw.getId(), null);
    }

    // ============================================================
    //  STUDENT — rich progress view
    // ============================================================

    @Transactional
    public WorkflowProgressResponse getProgress(Long studentId, Long studentWorkflowId) {
        StudentWorkflow sw = studentWorkflowRepository.findById(studentWorkflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (!sw.getStudent().getId().equals(studentId)) {
            throw new ResourceNotFoundException("Not found");
        }

        List<WorkflowStep> steps = stepRepository
                .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());

        ensureStepsExist(sw, steps);

        List<StudentWorkflowStep> tracking = studentWorkflowStepRepository
                .findByStudentWorkflowIdOrderByWorkflowStepStepOrderAsc(sw.getId());

        Map<Long, StudentWorkflowStep> trackingByStepId = new HashMap<>();
        for (StudentWorkflowStep t : tracking) {
            trackingByStepId.put(t.getWorkflowStep().getId(), t);
        }

        Map<Long, String> staffNames = new HashMap<>();
        for (StudentWorkflowStep t : tracking) {
            if (t.getCompletedByUserId() != null && !staffNames.containsKey(t.getCompletedByUserId())) {
                userRepository.findById(t.getCompletedByUserId())
                        .ifPresent(u -> staffNames.put(u.getId(), u.getFullName()));
            }
        }

        List<WorkflowProgressResponse.ProgressStep> stepViews = new ArrayList<>();
        int completedCount = 0;
        WorkflowProgressResponse.ProgressStep current = null;

        for (WorkflowStep step : steps) {
            StudentWorkflowStep t = trackingByStepId.get(step.getId());
            String state;
            if (t != null && t.getStatus() == StepStatus.COMPLETED) {
                state = "COMPLETED";
                completedCount++;
            } else if (step.getStepOrder().equals(sw.getCurrentStepOrder())
                    && sw.getStatus() == WorkflowStatus.IN_PROGRESS) {
                state = "CURRENT";
            } else if (t != null && t.getStatus() == StepStatus.IN_PROGRESS) {
                state = "CURRENT";
            } else {
                state = "LOCKED";
            }

            WorkflowProgressResponse.ProgressStep view = WorkflowProgressResponse.ProgressStep.builder()
                    .order(step.getStepOrder())
                    .queueId(step.getQueue().getId())
                    .queueName(step.getQueue().getName())
                    .label(step.getLabel())
                    .instructions(step.getInstructions())
                    .isRequired(step.getIsRequired())
                    .state(state)
                    .startedAt(t != null ? t.getStartedAt() : null)
                    .completedAt(t != null ? t.getCompletedAt() : null)
                    .completedByName(t != null && t.getCompletedByUserId() != null
                            ? staffNames.get(t.getCompletedByUserId())
                            : null)
                    .ticketId(t != null ? t.getTicketId() : null)
                    .notes(t != null ? t.getNotes() : null)
                    .build();

            stepViews.add(view);
            if ("CURRENT".equals(state)) current = view;
        }

        return WorkflowProgressResponse.builder()
                .id(sw.getId())
                .workflowName(sw.getWorkflow().getName())
                .description(sw.getWorkflow().getDescription())
                .session(sw.getWorkflow().getSession())
                .status(sw.getStatus().name())
                .currentStepOrder(sw.getCurrentStepOrder())
                .totalSteps(steps.size())
                .completedSteps(completedCount)
                .startedAt(sw.getStartedAt())
                .completedAt(sw.getCompletedAt())
                .currentQueueId(current != null ? current.getQueueId() : null)
                .currentQueueName(current != null ? current.getQueueName() : null)
                .currentStepLabel(current != null ? current.getLabel() : null)
                .currentStepInstructions(current != null ? current.getInstructions() : null)
                .steps(stepViews)
                .build();
    }

    // ============================================================
    //  GATE CHECK — called by TicketService
    // ============================================================

    @Transactional(readOnly = true)
    public void assertCanJoinQueue(Long studentId, Long queueId) {
        List<StudentWorkflow> active = studentWorkflowRepository
                .findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .filter(sw -> sw.getStatus() == WorkflowStatus.IN_PROGRESS)
                .toList();

        for (StudentWorkflow sw : active) {
            List<WorkflowStep> steps = stepRepository
                    .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());

            WorkflowStep thisQueueStep = steps.stream()
                    .filter(s -> s.getQueue().getId().equals(queueId))
                    .findFirst().orElse(null);

            if (thisQueueStep == null) continue;

            if (!thisQueueStep.getStepOrder().equals(sw.getCurrentStepOrder())) {
                WorkflowStep currentStep = steps.stream()
                        .filter(s -> s.getStepOrder().equals(sw.getCurrentStepOrder()))
                        .findFirst().orElse(null);
                String currentStepName = currentStep != null ? stepLabel(currentStep) : "unknown";
                throw new BadRequestException(
                        "You must complete step " + sw.getCurrentStepOrder() + " (\"" +
                                currentStepName + "\") before joining this queue.");
            }
        }
    }

    @Transactional
    public void onTicketCompleted(Long studentId, Long queueId) {
        List<StudentWorkflow> active = studentWorkflowRepository
                .findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .filter(sw -> sw.getStatus() == WorkflowStatus.IN_PROGRESS)
                .toList();

        for (StudentWorkflow sw : active) {
            List<WorkflowStep> steps = stepRepository
                    .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());

            WorkflowStep step = steps.stream()
                    .filter(s -> s.getQueue().getId().equals(queueId))
                    .findFirst().orElse(null);
            if (step == null) continue;
            if (!step.getStepOrder().equals(sw.getCurrentStepOrder())) continue;

            markStepCompleted(sw, step);

            int nextOrder = step.getStepOrder() + 1;
            WorkflowStep nextStep = steps.stream()
                    .filter(s -> s.getStepOrder().equals(nextOrder))
                    .findFirst().orElse(null);

            auditService.record(studentId, sw.getWorkflow().getUniversity().getId(),
                    AuditAction.WORKFLOW_STEP_COMPLETED, "StudentWorkflow", sw.getId(),
                    "{\"stepOrder\":" + step.getStepOrder() + ",\"queueId\":" + queueId + "}");

            if (nextStep == null) {
                sw.setStatus(WorkflowStatus.COMPLETED);
                sw.setCompletedAt(LocalDateTime.now());
                studentWorkflowRepository.save(sw);

                notificationService.notify(sw.getStudent(), NotificationType.SYSTEM,
                        "Workflow complete! 🎉",
                        "You've completed all steps of \"" + sw.getWorkflow().getName() + "\".");

                auditService.record(studentId, sw.getWorkflow().getUniversity().getId(),
                        AuditAction.WORKFLOW_COMPLETED, "StudentWorkflow", sw.getId(), null);
            } else {
                sw.setCurrentStepOrder(nextOrder);
                studentWorkflowRepository.save(sw);

                unlockStep(sw, nextStep);

                notificationService.notify(sw.getStudent(), NotificationType.SYSTEM,
                        "Step " + step.getStepOrder() + " completed",
                        "Next step: " + stepLabel(nextStep) + ". Join the \"" +
                                nextStep.getQueue().getName() + "\" queue when ready.");
            }
        }
    }

    // ============================================================
    //  STEP TRACKING HELPERS
    // ============================================================

    private void createStepTracking(StudentWorkflow sw, List<WorkflowStep> steps) {
        for (int i = 0; i < steps.size(); i++) {
            WorkflowStep step = steps.get(i);
            StudentWorkflowStep tracking = StudentWorkflowStep.builder()
                    .studentWorkflow(sw)
                    .workflowStep(step)
                    .status(i == 0 ? StepStatus.IN_PROGRESS : StepStatus.PENDING)
                    .startedAt(i == 0 ? LocalDateTime.now() : null)
                    .build();
            studentWorkflowStepRepository.save(tracking);
        }
    }

    private void ensureStepsExist(StudentWorkflow sw, List<WorkflowStep> steps) {
        long existing = studentWorkflowStepRepository
                .countByStudentWorkflowIdAndStatus(sw.getId(), StepStatus.PENDING)
                + studentWorkflowStepRepository
                .countByStudentWorkflowIdAndStatus(sw.getId(), StepStatus.IN_PROGRESS)
                + studentWorkflowStepRepository
                .countByStudentWorkflowIdAndStatus(sw.getId(), StepStatus.COMPLETED);
        if (existing > 0 || steps.isEmpty()) return;

        log.info("Backfilling workflow steps for StudentWorkflow {}", sw.getId());
        for (WorkflowStep step : steps) {
            StepStatus status;
            if (step.getStepOrder() < sw.getCurrentStepOrder()) {
                status = StepStatus.COMPLETED;
            } else if (step.getStepOrder().equals(sw.getCurrentStepOrder())) {
                status = StepStatus.IN_PROGRESS;
            } else {
                status = StepStatus.PENDING;
            }
            StudentWorkflowStep tracking = StudentWorkflowStep.builder()
                    .studentWorkflow(sw)
                    .workflowStep(step)
                    .status(status)
                    .startedAt(status == StepStatus.IN_PROGRESS ? LocalDateTime.now() : null)
                    .completedAt(status == StepStatus.COMPLETED ? LocalDateTime.now() : null)
                    .build();
            studentWorkflowStepRepository.save(tracking);
        }
    }

    private void markStepCompleted(StudentWorkflow sw, WorkflowStep step) {
        Optional<StudentWorkflowStep> opt = studentWorkflowStepRepository
                .findByStudentWorkflowIdAndWorkflowStepId(sw.getId(), step.getId());
        if (opt.isEmpty()) {
            StudentWorkflowStep tracking = StudentWorkflowStep.builder()
                    .studentWorkflow(sw)
                    .workflowStep(step)
                    .status(StepStatus.COMPLETED)
                    .completedAt(LocalDateTime.now())
                    .build();
            studentWorkflowStepRepository.save(tracking);
            return;
        }
        StudentWorkflowStep tracking = opt.get();
        tracking.setStatus(StepStatus.COMPLETED);
        tracking.setCompletedAt(LocalDateTime.now());
        studentWorkflowStepRepository.save(tracking);
    }

    private void unlockStep(StudentWorkflow sw, WorkflowStep step) {
        Optional<StudentWorkflowStep> opt = studentWorkflowStepRepository
                .findByStudentWorkflowIdAndWorkflowStepId(sw.getId(), step.getId());
        if (opt.isEmpty()) return;
        StudentWorkflowStep tracking = opt.get();
        if (tracking.getStatus() == StepStatus.PENDING) {
            tracking.setStatus(StepStatus.IN_PROGRESS);
            tracking.setStartedAt(LocalDateTime.now());
            studentWorkflowStepRepository.save(tracking);
        }
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private String stepLabel(WorkflowStep step) {
        if (step.getLabel() != null && !step.getLabel().isBlank()) return step.getLabel();
        return step.getQueue() != null ? step.getQueue().getName() : "Step " + step.getStepOrder();
    }
}