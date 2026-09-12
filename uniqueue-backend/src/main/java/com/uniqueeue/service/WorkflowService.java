package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateWorkflowRequest;
import com.uniqueeue.dto.request.UpdateWorkflowStepRequest;
import com.uniqueeue.dto.response.StudentWorkflowResponse;
import com.uniqueeue.dto.response.WorkflowResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.enums.WorkflowStatus;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.*;
import com.uniqueeue.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository stepRepository;
    private final StudentWorkflowRepository studentWorkflowRepository;
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

        // Validate all queues belong to this university
        List<Queue> queues = new ArrayList<>();
        for (CreateWorkflowRequest.StepInput input : request.getSteps()) {
            Queue q = queueRepository.findByIdAndUniversityId(input.getQueueId(), universityId)
                    .orElseThrow(() -> new BadRequestException(
                            "Queue " + input.getQueueId() + " not found in your university"));
            queues.add(q);
        }

        Workflow workflow = Workflow.builder()
                .university(admin.getUniversity())
                .name(request.getName())
                .description(request.getDescription())
                .session(request.getSession())
                .isActive(true)
                .createdBy(admin)
                .build();
        workflow = workflowRepository.save(workflow);

        // Create steps with sequential order 1..N
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

        // Reject if any student is still in progress
        long active = studentWorkflowRepository.countByWorkflowIdAndStatus(workflowId, WorkflowStatus.IN_PROGRESS);
        if (active > 0) {
            throw new BadRequestException("Cannot delete — " + active + " student(s) still in progress");
        }

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
            throw new BadRequestException("Not in your university");
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
                    return StudentWorkflowResponse.from(sw, steps);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentWorkflowResponse getMine(Long studentId, Long studentWorkflowId) {
        StudentWorkflow sw = studentWorkflowRepository.findById(studentWorkflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (!sw.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("Not yours");
        }
        List<WorkflowStep> steps = stepRepository
                .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());
        return StudentWorkflowResponse.from(sw, steps);
    }

    @Transactional
    public void abandon(Long studentId, Long studentWorkflowId) {
        StudentWorkflow sw = studentWorkflowRepository.findById(studentWorkflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Not found"));
        if (!sw.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("Not yours");
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
    //  GATE CHECK — called by TicketService
    // ============================================================

    /**
     * Called before a student joins a queue. If the queue is part of a workflow
     * and the student is currently in progress on that workflow, they can only
     * join the queue at their current step.
     *
     * Returns null if there's no blocking constraint.
     * Throws BadRequestException if joining would be out-of-order.
     */
    @Transactional(readOnly = true)
    public void assertCanJoinQueue(Long studentId, Long queueId) {
        // Find an active StudentWorkflow for this student where this queue is a step
        List<StudentWorkflow> active = studentWorkflowRepository
                .findByStudentIdOrderByStartedAtDesc(studentId).stream()
                .filter(sw -> sw.getStatus() == WorkflowStatus.IN_PROGRESS)
                .toList();

        for (StudentWorkflow sw : active) {
            List<WorkflowStep> steps = stepRepository
                    .findByWorkflowIdOrderByStepOrderAsc(sw.getWorkflow().getId());

            // Is this queue part of this workflow?
            WorkflowStep thisQueueStep = steps.stream()
                    .filter(s -> s.getQueue().getId().equals(queueId))
                    .findFirst().orElse(null);

            if (thisQueueStep == null) continue;   // different workflow, ignore

            // Student is on this workflow. Only allow if it's their current step.
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

    /**
     * Called when a ticket is COMPLETED. If the ticket's queue is the current step
     * of any in-progress StudentWorkflow, advance that student's progress.
     */
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

            // Advance to next step
            int nextOrder = step.getStepOrder() + 1;
            WorkflowStep nextStep = steps.stream()
                    .filter(s -> s.getStepOrder().equals(nextOrder))
                    .findFirst().orElse(null);

            auditService.record(studentId, sw.getWorkflow().getUniversity().getId(),
                    AuditAction.WORKFLOW_STEP_COMPLETED, "StudentWorkflow", sw.getId(),
                    "{\"stepOrder\":" + step.getStepOrder() + ",\"queueId\":" + queueId + "}");

            if (nextStep == null) {
                // Last step completed → workflow done
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

                notificationService.notify(sw.getStudent(), NotificationType.SYSTEM,
                        "Step " + step.getStepOrder() + " completed",
                        "Next step: " + stepLabel(nextStep) + ". Join the \"" +
                                nextStep.getQueue().getName() + "\" queue when ready.");
            }
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