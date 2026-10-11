package com.uniqueeue.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter @Setter
@Component
@ConfigurationProperties(prefix = "uniqueue.bottlenecks")
public class BottleneckProperties {

    /** Master switch — set false to disable the scheduler entirely. */
    private boolean enabled = true;

    /** Cron expression. Default: top of every hour. */
    private String cron = "0 0 * * * *";

    /** A step is "slow" when avg hours per student exceeds this. */
    private double minAvgHours = 24.0;

    /** …AND at least this many students are currently waiting on it. */
    private long minStuck = 5;

    /** Don't re-alert about the same step within this window. */
    private int cooldownHours = 6;

    /** When true, log the alert instead of emailing. Useful in dev. */
    private boolean dryRun = false;
}