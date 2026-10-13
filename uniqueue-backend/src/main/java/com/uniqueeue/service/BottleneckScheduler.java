package com.uniqueeue.service;

import com.uniqueeue.config.BottleneckProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BottleneckScheduler {

    private final BottleneckProperties props;
    private final BottleneckService bottleneckService;

    @Scheduled(cron = "${uniqueue.bottlenecks.cron:0 0 * * * *}")
    public void run() {
        if (!props.isEnabled()) {
            log.debug("Bottleneck scheduler disabled — skipping");
            return;
        }
        log.info("Running scheduled bottleneck scan…");
        try {
            BottleneckService.ScanResult scanResult = bottleneckService.scan();
            log.info("Bottleneck scan: {} workflows, {} bottlenecks, {} alerts sent ({} ms)",
                    scanResult.workflowsScanned(), scanResult.bottlenecksFound(), scanResult.alertsSent(), scanResult.tookMs());
        } catch (Exception ex) {
            log.error("Bottleneck scan failed", ex);
        }
    }
}