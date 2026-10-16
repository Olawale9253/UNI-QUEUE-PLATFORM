package com.uniqueeue.service;

import com.uniqueeue.TestFixtures;
import com.uniqueeue.dto.response.WorkflowProgressResponse;
import com.uniqueeue.enums.StepStatus;
import com.uniqueeue.enums.WorkflowStatus;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.*;
import com.uniqueeue.repository.StudentWorkflowRepository;
import com.uniqueeue.repository.StudentWorkflowStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class WorkflowServiceTest {

    @Autowired WorkflowService workflowService;
    @Autowired StudentWorkflowRepository studentWorkflowRepository;
    @Autowired StudentWorkflowStepRepository studentWorkflowStepRepository;
    @Autowired TestFixtures fixtures;

    @MockitoBean EmailService emailService;
    @MockitoBean AsyncPushService asyncPushService;

    private User student;
    private Workflow workflow;
    private WorkflowStep firstStep;
    private WorkflowStep secondStep;
    private Queue paymentQueue;
    private Queue registrationQueue;

    @BeforeEach
    void setup() {
        TestFixtures.WorkflowFixture workflowFixture = fixtures.buildWithWorkflow();
        student = workflowFixture.base().student();
        workflow = workflowFixture.workflow();
        firstStep = workflowFixture.firstStep();
        secondStep = workflowFixture.secondStep();
        paymentQueue = workflowFixture.base().paymentQueue();
        registrationQueue = workflowFixture.base().registrationQueue();
    }

    // ─── START ────────────────────────────────────────────────

    @Test
    @DisplayName("start creates a StudentWorkflow with an IN_PROGRESS status")
    void start_createsInProgressEnrollment() {
        workflowService.start(student.getId(), workflow.getId());

        List<StudentWorkflow> mine =
                studentWorkflowRepository.findByStudentIdOrderByStartedAtDesc(student.getId());

        assertThat(mine).hasSize(1);
        assertThat(mine.get(0).getStatus()).isEqualTo(WorkflowStatus.IN_PROGRESS);
        assertThat(mine.get(0).getCurrentStepOrder()).isEqualTo(1);
    }

    @Test
    @DisplayName("start also creates one tracking row per step with the right initial statuses")
    void start_createsStepTracking() {
        workflowService.start(student.getId(), workflow.getId());

        StudentWorkflow sw = studentWorkflowRepository
                .findByStudentIdOrderByStartedAtDesc(student.getId()).get(0);
        List<StudentWorkflowStep> tracking = studentWorkflowStepRepository
                .findByStudentWorkflowIdOrderByWorkflowStepStepOrderAsc(sw.getId());

        assertThat(tracking).hasSize(2);
        assertThat(tracking.get(0).getWorkflowStep().getId()).isEqualTo(firstStep.getId());
        assertThat(tracking.get(0).getStatus()).isEqualTo(StepStatus.IN_PROGRESS);
        assertThat(tracking.get(1).getWorkflowStep().getId()).isEqualTo(secondStep.getId());
        assertThat(tracking.get(1).getStatus()).isEqualTo(StepStatus.PENDING);
    }

    @Test
    @DisplayName("start refuses a second enrollment for the same workflow")
    void start_whenAlreadyEnrolled_throws() {
        workflowService.start(student.getId(), workflow.getId());

        assertThatThrownBy(() -> workflowService.start(student.getId(), workflow.getId()))
                .hasMessageContaining("already started");
    }

    // ─── AUTO-ENROLL ON QUEUE JOIN ────────────────────────────

    @Test
    @DisplayName("autoEnrollOnQueueJoin enrolls when the joined queue is the first step")
    void autoEnroll_firstStep_enrolls() {
        workflowService.autoEnrollOnQueueJoin(student.getId(), paymentQueue.getId());

        Optional<StudentWorkflow> sw = studentWorkflowRepository
                .findByStudentIdAndWorkflowId(student.getId(), workflow.getId());

        assertThat(sw).isPresent();
        assertThat(sw.get().getStatus()).isEqualTo(WorkflowStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("autoEnrollOnQueueJoin skips when the joined queue is not the first step")
    void autoEnroll_nonFirstStep_doesNothing() {
        workflowService.autoEnrollOnQueueJoin(student.getId(), registrationQueue.getId());

        Optional<StudentWorkflow> sw = studentWorkflowRepository
                .findByStudentIdAndWorkflowId(student.getId(), workflow.getId());

        assertThat(sw).isEmpty();
    }

    // ─── PROGRESS ─────────────────────────────────────────────

    @Test
    @DisplayName("getMyProgress returns 0% for a freshly started workflow")
    void getMyProgress_freshStart() {
        workflowService.start(student.getId(), workflow.getId());

        WorkflowProgressResponse progressResponse = workflowService.getMyProgress(student.getId());

        assertThat(progressResponse.getWorkflowName()).isEqualTo("Fresher Clearance");
        assertThat(progressResponse.getTotalSteps()).isEqualTo(2);
        assertThat(progressResponse.getCompletedSteps()).isEqualTo(0);
        assertThat(progressResponse.getProgressPercent()).isEqualTo(0);
        assertThat(progressResponse.getCurrentStepOrder()).isEqualTo(1);
        assertThat(progressResponse.getNextAction()).isNotNull();
        assertThat(progressResponse.getNextAction().getQueueId()).isEqualTo(paymentQueue.getId());
    }

    @Test
    @DisplayName("getMyProgress throws 404-equivalent when the student has no enrollment")
    void getMyProgress_noEnrollment_throws() {
        assertThatThrownBy(() -> workflowService.getMyProgress(student.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── GATE ─────────────────────────────────────────────────

    @Test
    @DisplayName("assertCanJoinQueue allows joining the current step's queue")
    void assertCanJoinQueue_currentStep_passes() {
        workflowService.start(student.getId(), workflow.getId());

        // No exception expected
        workflowService.assertCanJoinQueue(student.getId(), paymentQueue.getId());
    }

    @Test
    @DisplayName("assertCanJoinQueue blocks joining a locked step's queue")
    void assertCanJoinQueue_lockedStep_throws() {
        workflowService.start(student.getId(), workflow.getId());

        assertThatThrownBy(() ->
                workflowService.assertCanJoinQueue(student.getId(), registrationQueue.getId()))
                .hasMessageContaining("must complete step");
    }
}