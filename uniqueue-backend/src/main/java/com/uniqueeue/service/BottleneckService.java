package com.uniqueeue.service;

import com.uniqueeue.config.BottleneckProperties;
import com.uniqueeue.dto.response.WorkflowAnalyticsResponse;
import com.uniqueeue.enums.Role;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.model.Workflow;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BottleneckService {

    private final BottleneckProperties props;
    private final BottleneckAlertTracker tracker;
    private final WorkflowService workflowService;
    private final WorkflowRepository workflowRepository;
    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * Scan every active workflow and alert admins where a step is slow.
     * Returns a summary for logging / the manual trigger endpoint.
     */
    @Transactional(readOnly = true)
    public ScanResult scan() {
        long started = System.currentTimeMillis();

        int universitiesScanned = 0;
        int workflowsScanned = 0;
        int bottlenecksFound = 0;
        int alertsSent = 0;
        List<String> details = new ArrayList<>();

        List<University> universities = universityRepository.findAll();

        for (University uni : universities) {
            universitiesScanned++;
            List<Workflow> workflows = workflowRepository
                    .findByUniversityIdAndIsActiveTrueOrderByCreatedAtDesc(uni.getId());

            for (Workflow workflowValue : workflows) {
                workflowsScanned++;
                WorkflowAnalyticsResponse analytics;
                try {
                    analytics = workflowService.getAnalytics(workflowValue.getId(), uni.getId());
                } catch (Exception ex) {
                    log.warn("Skipping workflow {} — analytics failed: {}", workflowValue.getId(), ex.getMessage());
                    continue;
                }

                for (WorkflowAnalyticsResponse.StepAnalytics step : analytics.getSteps()) {
                    if (!isBottleneck(step)) continue;

                    bottlenecksFound++;
                    boolean fresh = tracker.shouldAlert(uni.getId(), workflowValue.getId(), step.getOrder());

                    String line = String.format(
                            "uni=%d wf=%d step=%d stuck=%d avg=%.1fh",
                            uni.getId(), workflowValue.getId(), step.getOrder(),
                            step.getCurrentlyOnCount(), step.getAvgHoursOnStep());

                    if (fresh) {
                        if (!props.isDryRun()) {
                            notifyAdmins(uni, analytics, step);
                        }
                        tracker.markAlerted(uni.getId(), workflowValue.getId(), step.getOrder());
                        alertsSent++;
                        details.add("ALERT " + line);
                    } else {
                        details.add("skipped(cooldown) " + line);
                    }
                }
            }
        }

        long tookMs = System.currentTimeMillis() - started;
        log.info("Bottleneck scan complete in {}ms — scanned {} universities, {} workflows, " +
                        "found {} bottlenecks, sent {} alerts",
                tookMs, universitiesScanned, workflowsScanned, bottlenecksFound, alertsSent);

        return new ScanResult(universitiesScanned, workflowsScanned,
                bottlenecksFound, alertsSent, tookMs, details);
    }

    private boolean isBottleneck(WorkflowAnalyticsResponse.StepAnalytics step) {
        if (step.getAvgHoursOnStep() == null || step.getCurrentlyOnCount() == null) return false;
        return step.getAvgHoursOnStep() >= props.getMinAvgHours()
                && step.getCurrentlyOnCount() >= props.getMinStuck();
    }

    private void notifyAdmins(University uni,
                              WorkflowAnalyticsResponse analytics,
                              WorkflowAnalyticsResponse.StepAnalytics step) {
        List<User> admins = userRepository.findByUniversityIdAndRole(uni.getId(), Role.ADMIN);
        if (admins.isEmpty()) {
            log.warn("Bottleneck detected for uni {} but no admins to notify", uni.getId());
            return;
        }
        for (User admin : admins) {
            try {
                emailService.sendBottleneckAlert(admin, analytics, step);
            } catch (Exception ex) {
                log.error("Failed to email bottleneck alert to {}: {}", admin.getEmail(), ex.getMessage());
            }
        }
    }

    public record ScanResult(
            int universitiesScanned,
            int workflowsScanned,
            int bottlenecksFound,
            int alertsSent,
            long tookMs,
            List<String> details
    ) {}
}