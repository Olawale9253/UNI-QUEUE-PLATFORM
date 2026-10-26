package com.uniqueeue.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Default executor for fire-and-forget tasks (emails, audit logging, etc.).
     * Plain @Async methods use this bean automatically because its name
     * matches what Spring looks for by convention.
     *
     * Tuned for burst load: 10 concurrent threads drain a 50-email burst in
     * ~8 seconds while the 1000-task queue prevents rejection. Threads are
     * released after 60s idle so Render's free tier stays memory-light.
     * CallerRunsPolicy means that if the queue somehow overflows, the caller
     * thread runs the task inline rather than losing the email — slower but
     * safer than dropping notifications.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2);
        ex.setMaxPoolSize(10);
        ex.setQueueCapacity(1000);
        ex.setThreadNamePrefix("task-");
        ex.setKeepAliveSeconds(60);
        ex.setAllowCoreThreadTimeOut(true);
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(10);
        ex.initialize();
        return ex;
    }

    /**
     * Dedicated pool for outbound Web Push. Isolated so a slow push endpoint
     * can never starve the mail queue. Push notifications are best-effort —
     * we don't block the request thread, so CallerRunsPolicy is safe here too.
     */
    @Bean(name = "pushExecutor")
    public Executor pushExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(500);
        ex.setThreadNamePrefix("push-");
        ex.setKeepAliveSeconds(60);
        ex.setAllowCoreThreadTimeOut(true);
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(5);
        ex.initialize();
        return ex;
    }
}