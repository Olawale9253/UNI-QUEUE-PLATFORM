package com.uniqueeue.service;

import com.uniqueeue.TestFixtures;
import com.uniqueeue.config.BottleneckProperties;
import com.uniqueeue.model.University;
import com.uniqueeue.model.Workflow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BottleneckServiceTest {

    @Autowired BottleneckService bottleneckService;
    @Autowired BottleneckAlertTracker tracker;
    @Autowired BottleneckProperties props;
    @Autowired WorkflowService workflowService;
    @Autowired TestFixtures fixtures;

    @MockitoBean EmailService emailService;
    @MockitoBean AsyncPushService asyncPushService;

    private University university;
    private Workflow workflow;
    private Long studentId;

    @BeforeEach
    void setup() {
        // Clear the cooldown map so tests don't interfere with each other
        tracker.reset();

        TestFixtures.WorkflowFixture wf = fixtures.buildWithWorkflow();
        university = wf.base().university();
        workflow = wf.workflow();
        studentId = wf.base().student().getId();

        // Low thresholds so a single enrollment triggers detection
        props.setMinAvgHours(0);
        props.setMinStuck(1);
        props.setDryRun(true);
    }

    @Test
    @DisplayName("scan finds a bottleneck when thresholds are met")
    void scan_detectsBottleneck() {
        // Fresh enrollment → student is IN_PROGRESS on step 1 (currentlyOnCount = 1).
        workflowService.start(studentId, workflow.getId());

        BottleneckService.ScanResult scanResultValue = bottleneckService.scan();

        assertThat(scanResultValue.bottlenecksFound()).isGreaterThanOrEqualTo(1);
        assertThat(scanResultValue.alertsSent()).isGreaterThanOrEqualTo(1);
        assertThat(scanResultValue.workflowsScanned()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("scan skips alerts on the second run within the cooldown window")
    void scan_appliesCooldown() {
        workflowService.start(studentId, workflow.getId());

        BottleneckService.ScanResult first = bottleneckService.scan();
        BottleneckService.ScanResult second = bottleneckService.scan();

        assertThat(first.alertsSent()).isGreaterThanOrEqualTo(1);
        assertThat(second.alertsSent()).isZero();
        assertThat(second.bottlenecksFound()).isGreaterThanOrEqualTo(1); // still detects, just doesn't alert
    }

    @Test
    @DisplayName("scan finds nothing when thresholds are impossibly high")
    void scan_noBottleneckWhenThresholdsHigh() {
        props.setMinAvgHours(999);
        props.setMinStuck(999);

        workflowService.start(studentId, workflow.getId());

        BottleneckService.ScanResult scanResultValue2 = bottleneckService.scan();

        assertThat(scanResultValue2.bottlenecksFound()).isZero();
        assertThat(scanResultValue2.alertsSent()).isZero();
    }

    @Test
    @DisplayName("dry-run mode logs but never calls EmailService")
    void scan_dryRun_doesNotSendEmail() {
        props.setDryRun(true);
        workflowService.start(studentId, workflow.getId());

        bottleneckService.scan();

        verify(emailService, never()).sendBottleneckAlert(any(), any(), any());
    }

    @Test
    @DisplayName("non-dry-run sends an email to the university's admins")
    void scan_nonDryRun_sendsEmail() {
        props.setDryRun(false);
        workflowService.start(studentId, workflow.getId());

        bottleneckService.scan();

        // The fixture creates exactly one admin — one email expected
        verify(emailService, atLeastOnce())
                .sendBottleneckAlert(any(), any(), any());
    }
}