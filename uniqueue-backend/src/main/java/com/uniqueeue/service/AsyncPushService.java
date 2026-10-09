package com.uniqueeue.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Wraps WebPushService so the HTTP call happens on a background thread.
 * Must be a separate bean from NotificationService — @Async requires a
 * cross-bean call for Spring's proxy to intercept it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncPushService {

    private final WebPushService webPushService;

    @Async("pushExecutor")
    public void send(Long userId, String title, String message, Map<String, Object> data) {
        try {
            webPushService.sendToUser(userId, title, message, data);
        } catch (Exception ex) {
            log.error("Async push failed for user {}: {}", userId, ex.getMessage());
        }
    }
}