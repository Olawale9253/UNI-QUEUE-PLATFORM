package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateWorkflowRequest;
import com.uniqueeue.dto.request.UpdateWorkflowStepRequest;
import com.uniqueeue.dto.response.StudentWorkflowResponse;
import com.uniqueeue.dto.response.WorkflowAnalyticsResponse;
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

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private final EventService eventService;

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
            Queue queueValue8 = queueRepository.findByIdAndUniversityId(input.getQueueId(), universityId)
                    .orElseThrow(() -> new BadRequestException(
                            "Queue " + input.getQueueId() + " not found in your university"));
            queues.add(queueValue8);
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
        for (int indexValue11 = 0; indexValue11 < request.getSteps().size(); indexValue11++) {
            CreateWorkflowRequest.StepInput input = request.getSteps().get(indexValue11);
            WorkflowStep step = WorkflowStep.builder()
                    .workflow(workflow)
                    .queue(queues.get(indexValue11))
                    .stepOrder(indexValue11 + 1)
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
                .map(workflowValue2 -> {
                    List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowValue2.getId());
                    long inProgress = studentWorkflowRepository.countByWorkflowIdAndStatus(workflowValue2.getId(), WorkflowStatus.IN_PROGRESS);
                    long completed = studentWorkflowRepository.countByWorkflowIdAndStatus(workflowValue2.getId(), WorkflowStatus.COMPLETED);
                    return WorkflowResponse.from(workflowValue2, steps, inProgress, completed);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkflowResponse getOne(Long workflowId, Long universityId) {
        Workflow workflowValue3 = workflowRepository.findByIdAndUniversityId(workflowId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowValue3.getId());
        long inProgress = studentWorkflowRepository.countByWorkflowIdAndStatus(workflowValue3.getId(), WorkflowStatus.IN_PROGRESS);
        long completed = studentWorkflowRepository.countByWorkflowIdAndStatus(workflowValue3.getId(), WorkflowStatus.COMPLETED);
        return WorkflowResponse.from(workflowValue3, steps, inProgress, completed);
    }

    @Transactional
    public void delete(Long workflowId, Long universityId) {
        Workflow workflowValue4 = workflowRepository.findByIdAndUniversityId(workflowId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

        long active = studentWorkflowRepository.countByWorkflowIdAndStatus(workflowId, WorkflowStatus.IN_PROGRESS);
        if (active > 0) {
            throw new BadRequestException("Cannot delete — " + active + " student(s) still in progress");
        }

        List<StudentWorkflow> enrolled = studentWorkflowRepository.findByWorkflowId(workflowId);
        for (StudentWorkflow sw : enrolled) {
            studentWorkflowStepRepository.deleteByStudentWorkflowId(sw.getId());
        }
        studentWorkflowRepository.deleteAll(enrolled);

        stepRepository.deleteByWorkflowId(workflowId);
        workflowRepository.delete(workflowValue4);

        auditService.record(null, universityId,
                AuditAction.WORKFLOW_DELETED, "Workflow", workflowId,
                "{\"name\":\"" + workflowValue4.getName() + "\"}");
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
    //  ADMIN — analytics
    // ============================================================

    @Transactional(readOnly = true)
    public WorkflowAnalyticsResponse getAnalytics(Long workflowId, Long universityId) {
        Workflow workflowValue5 = workflowRepository.findByIdAndUniversityId(workflowId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowId);
        List<StudentWorkflow> enrollments = studentWorkflowRepository.findByWorkflowId(workflowId);

        long totalEnrolled = enrollments.size();
        long totalCompleted = enrollments.stream()
                .filter(sw -> sw.getStatus() == WorkflowStatus.COMPLETED)
                .count();
        long totalInProgress = enrollments.stream()
                .filter(sw -> sw.getStatus() == WorkflowStatus.IN_PROGRESS)
                .count();
        long totalAbandoned = enrollments.stream()
                .filter(sw -> sw.getStatus() == WorkflowStatus.ABANDONED)
                .count();

        // FIX: Use toMinutes() / 60.0 to get fractional hours instead of truncated whole hours
        double avgDays = enrollments.stream()
                .filter(sw -> sw.getStatus() == WorkflowStatus.COMPLETED
                        && sw.getStartedAt() != null
                        && sw.getCompletedAt() != null)
                .mapToDouble(sw -> Duration.between(sw.getStartedAt(), sw.getCompletedAt()).toMinutes() / 60.0)
                .average()
                .orElse(0) / 24.0;

        List<WorkflowAnalyticsResponse.StepAnalytics> stepStats = new ArrayList<>();
        double maxHours = 0;
        int bottleneckIndex = -1;

        for (int indexValue12 = 0; indexValue12 < steps.size(); indexValue12++) {
            WorkflowStep step = steps.get(indexValue12);

            long completed = studentWorkflowStepRepository
                    .countByWorkflowStepIdAndStatus(step.getId(), StepStatus.COMPLETED);
            long onStep = studentWorkflowStepRepository
                    .countByWorkflowStepIdAndStatus(step.getId(), StepStatus.IN_PROGRESS);
            long pending = studentWorkflowStepRepository
                    .countByWorkflowStepIdAndStatus(step.getId(), StepStatus.PENDING);

            // FIX: Calculate in minutes, then convert to fractional hours
            double avgHours = 0;
            var onThisStep = studentWorkflowStepRepository
                    .findByWorkflowStepIdAndStatusAndStartedAtIsNotNullAndCompletedAtIsNotNull(
                            step.getId(), StepStatus.COMPLETED);
            if (!onThisStep.isEmpty()) {
                avgHours = onThisStep.stream()
                        .mapToDouble(valueValue5 ->
                                Duration.between(valueValue5.getStartedAt(), valueValue5.getCompletedAt()).toMinutes() / 60.0)
                        .average()
                        .orElse(0);
            }

            if (avgHours > maxHours) {
                maxHours = avgHours;
                bottleneckIndex = indexValue12;
            }

            stepStats.add(WorkflowAnalyticsResponse.StepAnalytics.builder()
                    .order(step.getStepOrder())
                    .queueId(step.getQueue().getId())
                    .queueName(step.getQueue().getName())
                    .label(step.getLabel())
                    .completedCount(completed)
                    .currentlyOnCount(onStep)
                    .pendingCount(pending)
                    .avgHoursOnStep(Math.round(avgHours * 10.0) / 10.0)
                    .isBottleneck(false)
                    .build());
        }

        if (bottleneckIndex >= 0 && maxHours > 0 && stepStats.size() > 1) {
            stepStats.get(bottleneckIndex).setIsBottleneck(true);
        }

        return WorkflowAnalyticsResponse.builder()
                .workflowId(workflowValue5.getId())
                .workflowName(workflowValue5.getName())
                .session(workflowValue5.getSession())
                .totalEnrolled(totalEnrolled)
                .totalCompleted(totalCompleted)
                .totalInProgress(totalInProgress)
                .totalAbandoned(totalAbandoned)
                .avgCompletionDays(Math.round(avgDays * 10.0) / 10.0)
                .totalSteps(steps.size())
                .steps(stepStats)
                .build();
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
                .map(valueValue6 -> {
                    List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(valueValue6.getId());
                    return WorkflowResponse.from(valueValue6, steps, 0, 0);
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
                        firstStep.getQueue().getName() + "\" queue to proceed.",
                "/student/clearance");

        auditService.record(studentId, workflow.getUniversity().getId(),
                AuditAction.WORKFLOW_STARTED, "StudentWorkflow", sw.getId(),
                "{\"workflowId\":" + workflowId + "}");

        eventService.broadcastToUser(studentId, "workflow:updated",
                Map.of("studentId", studentId, "status", "IN_PROGRESS"));

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

        eventService.broadcastToUser(studentId, "workflow:updated",
                Map.of("studentId", studentId, "status", "ABANDONED"));
    }

    // ============================================================
    //  STUDENT — my workflow progress (Phase A)
    // ============================================================

    @Transactional(readOnly = true)
    public WorkflowProgressResponse getMyProgress(Long studentId) {
        StudentWorkflow enrollment = studentWorkflowRepository
                .findFirstByStudentIdAndStatusOrderByStartedAtDesc(studentId, WorkflowStatus.IN_PROGRESS)
                .orElseGet(() -> studentWorkflowRepository
                        .findFirstByStudentIdOrderByStartedAtDesc(studentId)
                        .orElseThrow(() -> new ResourceNotFoundException("You are not enrolled in any workflow")));

        Workflow workflow = enrollment.getWorkflow();
        List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflow.getId());

        List<StudentWorkflowStep> tracking = studentWorkflowStepRepository
                .findByStudentWorkflowIdOrderByWorkflowStepStepOrderAsc(enrollment.getId());
        Map<Long, StudentWorkflowStep> byStepId = tracking.stream()
                .collect(Collectors.toMap(studentWorkflowStep -> studentWorkflowStep.getWorkflowStep().getId(), studentWorkflowStepValue -> studentWorkflowStepValue, (studentWorkflowStepValue2, studentWorkflowStepValue3) -> studentWorkflowStepValue2));

        List<WorkflowProgressResponse.StepProgress> stepList = new ArrayList<>();
        int completedCount = 0;
        Integer currentOrder = null;

        for (WorkflowStep step : steps) {
            StudentWorkflowStep studentWorkflowStepValue4 = byStepId.get(step.getId());
            StepStatus stepStatus = (studentWorkflowStepValue4 != null) ? studentWorkflowStepValue4.getStatus() : StepStatus.PENDING;

            if (stepStatus == StepStatus.COMPLETED) completedCount++;
            if (stepStatus == StepStatus.IN_PROGRESS && currentOrder == null) {
                currentOrder = step.getStepOrder();
            }

            stepList.add(WorkflowProgressResponse.StepProgress.builder()
                    .order(step.getStepOrder())
                    .queueId(step.getQueue() != null ? step.getQueue().getId() : null)
                    .queueName(step.getQueue() != null ? step.getQueue().getName() : null)
                    .officeName(step.getQueue() != null && step.getQueue().getOffice() != null
                            ? step.getQueue().getOffice().getName() : null)
                    .label(step.getLabel())
                    .status(stepStatus)
                    .startedAt(studentWorkflowStepValue4 != null ? studentWorkflowStepValue4.getStartedAt() : null)
                    .completedAt(studentWorkflowStepValue4 != null ? studentWorkflowStepValue4.getCompletedAt() : null)
                    .isCurrent(false)
                    .build());
        }

        if (currentOrder != null && currentOrder - 1 < stepList.size()) {
            stepList.get(currentOrder - 1).setIsCurrent(true);
        }

        int total = steps.size();
        int pct = total > 0 ? (int) Math.round((completedCount * 100.0) / total) : 0;

        WorkflowProgressResponse.NextAction nextAction = null;
        if (currentOrder != null && currentOrder - 1 < stepList.size()) {
            var cur = stepList.get(currentOrder - 1);
            nextAction = WorkflowProgressResponse.NextAction.builder()
                    .queueId(cur.getQueueId())
                    .queueName(cur.getQueueName())
                    .officeName(cur.getOfficeName())
                    .label(cur.getLabel())
                    .build();
        }

        return WorkflowProgressResponse.builder()
                .enrollmentId(enrollment.getId())
                .workflowId(workflow.getId())
                .workflowName(workflow.getName())
                .session(workflow.getSession())
                .status(enrollment.getStatus().name())
                .startedAt(enrollment.getStartedAt())
                .completedAt(enrollment.getCompletedAt())
                .currentStepOrder(currentOrder)
                .totalSteps(total)
                .completedSteps(completedCount)
                .progressPercent(pct)
                .nextAction(nextAction)
                .steps(stepList)
                .build();
    }

    // ============================================================
    //  AUTO-ENROLL
    // ============================================================

    @Transactional
    public void autoEnrollOnQueueJoin(Long studentId, Long queueId) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null || student.getUniversity() == null) return;

        boolean hasActive = studentWorkflowRepository
                .findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .anyMatch(sw -> sw.getStatus() == WorkflowStatus.IN_PROGRESS);
        if (hasActive) return;

        List<Workflow> candidates = workflowRepository
                .findByUniversityIdAndIsActiveTrueOrderByCreatedAtDesc(student.getUniversity().getId());

        Workflow match = null;
        for (Workflow workflowValue6 : candidates) {
            List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflowValue6.getId());
            if (steps.isEmpty()) continue;
            if (steps.get(0).getQueue().getId().equals(queueId)) {
                match = workflowValue6;
                break;
            }
        }
        if (match == null) return;

        studentWorkflowRepository.findByStudentIdAndWorkflowId(studentId, match.getId())
                .ifPresent(old -> {
                    studentWorkflowStepRepository.deleteByStudentWorkflowId(old.getId());
                    studentWorkflowRepository.delete(old);
                });

        start(studentId, match.getId());

        log.info("Auto-enrolled student {} into workflow {} via queue {}",
                studentId, match.getId(), queueId);
    }

    // ============================================================
    //  STUDENT — rich progress view (legacy)
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
        for (StudentWorkflowStep studentWorkflowStepValue5 : tracking) {
            trackingByStepId.put(studentWorkflowStepValue5.getWorkflowStep().getId(), studentWorkflowStepValue5);
        }

        Map<Long, String> staffNames = new HashMap<>();
        for (StudentWorkflowStep studentWorkflowStepValue6 : tracking) {
            if (studentWorkflowStepValue6.getCompletedByUserId() != null && !staffNames.containsKey(studentWorkflowStepValue6.getCompletedByUserId())) {
                userRepository.findById(studentWorkflowStepValue6.getCompletedByUserId())
                        .ifPresent(valueValue7 -> staffNames.put(valueValue7.getId(), valueValue7.getFullName()));
            }
        }

        List<WorkflowProgressResponse.ProgressStep> stepViews = new ArrayList<>();
        int completedCount = 0;
        WorkflowProgressResponse.ProgressStep current = null;

        for (WorkflowStep step : steps) {
            StudentWorkflowStep studentWorkflowStepValue7 = trackingByStepId.get(step.getId());
            String state;
            if (studentWorkflowStepValue7 != null && studentWorkflowStepValue7.getStatus() == StepStatus.COMPLETED) {
                state = "COMPLETED";
                completedCount++;
            } else if (step.getStepOrder().equals(sw.getCurrentStepOrder())
                    && sw.getStatus() == WorkflowStatus.IN_PROGRESS) {
                state = "CURRENT";
            } else if (studentWorkflowStepValue7 != null && studentWorkflowStepValue7.getStatus() == StepStatus.IN_PROGRESS) {
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
                    .startedAt(studentWorkflowStepValue7 != null ? studentWorkflowStepValue7.getStartedAt() : null)
                    .completedAt(studentWorkflowStepValue7 != null ? studentWorkflowStepValue7.getCompletedAt() : null)
                    .completedByName(studentWorkflowStepValue7 != null && studentWorkflowStepValue7.getCompletedByUserId() != null
                            ? staffNames.get(studentWorkflowStepValue7.getCompletedByUserId())
                            : null)
                    .ticketId(studentWorkflowStepValue7 != null ? studentWorkflowStepValue7.getTicketId() : null)
                    .notes(studentWorkflowStepValue7 != null ? studentWorkflowStepValue7.getNotes() : null)
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
                .progressSteps(stepViews)
                .build();
    }

    // ============================================================
    //  GATE CHECK
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
                    .filter(workflowStepValue3 -> workflowStepValue3.getQueue().getId().equals(queueId))
                    .findFirst().orElse(null);

            if (thisQueueStep == null) continue;

            if (!thisQueueStep.getStepOrder().equals(sw.getCurrentStepOrder())) {
                WorkflowStep currentStep = steps.stream()
                        .filter(workflowStepValue4 -> workflowStepValue4.getStepOrder().equals(sw.getCurrentStepOrder()))
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

        Long universityIdForBroadcast = null;

        for (StudentWorkflow sw : active) {
            List<WorkflowStep> steps = stepRepository
                    .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());

            WorkflowStep step = steps.stream()
                    .filter(workflowStepValue5 -> workflowStepValue5.getQueue().getId().equals(queueId))
                    .findFirst().orElse(null);
            if (step == null) continue;
            if (!step.getStepOrder().equals(sw.getCurrentStepOrder())) continue;

            universityIdForBroadcast = sw.getWorkflow().getUniversity().getId();

            markStepCompleted(sw, step);

            int nextOrder = step.getStepOrder() + 1;
            WorkflowStep nextStep = steps.stream()
                    .filter(workflowStepValue6 -> workflowStepValue6.getStepOrder().equals(nextOrder))
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
                        "You've completed all steps of \"" + sw.getWorkflow().getName() + "\".",
                        "/student/clearance");

                auditService.record(studentId, sw.getWorkflow().getUniversity().getId(),
                        AuditAction.WORKFLOW_COMPLETED, "StudentWorkflow", sw.getId(), null);
            } else {
                sw.setCurrentStepOrder(nextOrder);
                studentWorkflowRepository.save(sw);

                unlockStep(sw, nextStep);

                notificationService.notify(sw.getStudent(), NotificationType.SYSTEM,
                        "Step " + step.getStepOrder() + " completed",
                        "Next step: " + stepLabel(nextStep) + ". Join the \"" +
                                nextStep.getQueue().getName() + "\" queue when ready.",
                        "/student/clearance");
            }
        }

        if (universityIdForBroadcast != null) {
            eventService.broadcastToUser(studentId, "workflow:updated",
                    Map.of("studentId", studentId));
            eventService.broadcastToUniversity(universityIdForBroadcast, "queue:updated",
                    Map.of("reason", "workflow-step-completed", "studentId", studentId));
        }
    }

    // ============================================================
    //  STEP TRACKING HELPERS
    // ============================================================

    private void createStepTracking(StudentWorkflow sw, List<WorkflowStep> steps) {
        for (int indexValue13 = 0; indexValue13 < steps.size(); indexValue13++) {
            WorkflowStep step = steps.get(indexValue13);
            StudentWorkflowStep tracking = StudentWorkflowStep.builder()
                    .studentWorkflow(sw)
                    .workflowStep(step)
                    .status(indexValue13 == 0 ? StepStatus.IN_PROGRESS : StepStatus.PENDING)
                    .startedAt(indexValue13 == 0 ? LocalDateTime.now() : null)
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