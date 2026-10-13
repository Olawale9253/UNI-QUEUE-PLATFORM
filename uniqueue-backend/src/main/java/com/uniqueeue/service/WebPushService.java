package com.uniqueeue.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniqueeue.model.PushSubscription;
import com.uniqueeue.repository.PushSubscriptionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends Web Push notifications to browsers / phones.
 *
 * Called from NotificationService after every in-app notification is
 * persisted, so users receive an OS-level popup even when the tab is
 * closed. The user's own device ringtone / notification sound plays —
 * we don't control the sound at the OS level, by design.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebPushService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final ObjectMapper json = new ObjectMapper();

    @Value("${app.push.vapid-public-key:}")
    private String vapidPublicKey;

    @Value("${app.push.vapid-private-key:}")
    private String vapidPrivateKey;

    @Value("${app.push.subject:mailto:noreply@uniqueue.app}")
    private String vapidSubject;

    private PushService pushService;

    @PostConstruct
    public void init() {
        // Register Bouncy Castle as a JCE provider — the web-push library
        // depends on it for the ECDH crypto behind VAPID signatures. Without
        // this, `new PushService(...)` throws "no such provider: BC".
        try {
            if (java.security.Security.getProvider("BC") == null) {
                java.security.Security.addProvider(
                        new org.bouncycastle.jce.provider.BouncyCastleProvider()
                );
                log.info("Bouncy Castle provider registered");
            }
        } catch (Exception exceptionValue14) {
            log.error("Failed to register Bouncy Castle: {}", exceptionValue14.getMessage());
        }

        if (vapidPublicKey == null || vapidPublicKey.isBlank()
                || vapidPrivateKey == null || vapidPrivateKey.isBlank()) {
            log.warn("Web Push is DISABLED — VAPID keys not configured");
            return;
        }
        try {
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("Web Push initialized");
        } catch (Exception exceptionValue15) {
            log.error("Failed to initialize Web Push: {}", exceptionValue15.getMessage(), exceptionValue15);
            pushService = null;
        }
    }

    /**
     * Send a push to every device this user has subscribed from.
     * Runs async so it never blocks the notification flow.
     */
    @Async
    @Transactional
    public void sendToUser(Long userId, String title, String body, Map<String, Object> data) {
        if (pushService == null) return;

        List<PushSubscription> subs = subscriptionRepository.findByUserId(userId);
        if (subs.isEmpty()) return;

        String payload = buildPayload(title, body, data);

        for (PushSubscription sub : subs) {
            try {
                Notification notification = new Notification(
                        sub.getEndpoint(),
                        sub.getP256dh(),
                        sub.getAuth(),
                        payload
                );
                HttpResponse response = pushService.send(notification);
                int status = response.getStatusLine().getStatusCode();

                if (status == 404 || status == 410) {
                    // Subscription is dead (browser uninstalled, data cleared)
                    log.debug("Removing stale subscription {} (HTTP {})", sub.getId(), status);
                    subscriptionRepository.delete(sub);
                } else if (status >= 200 && status < 300) {
                    sub.setLastUsedAt(LocalDateTime.now());
                    sub.setFailureCount(0);
                    subscriptionRepository.save(sub);
                } else {
                    log.warn("Push send returned HTTP {} for sub {}", status, sub.getId());
                    sub.setFailureCount((sub.getFailureCount() == null ? 0 : sub.getFailureCount()) + 1);
                    if (sub.getFailureCount() > 5) {
                        subscriptionRepository.delete(sub);
                    } else {
                        subscriptionRepository.save(sub);
                    }
                }
            } catch (Exception exceptionValue16) {
                log.debug("Push send failed for sub {}: {}", sub.getId(), exceptionValue16.getMessage());
                // Don't delete on network errors — could be transient
            }
        }
    }

    private String buildPayload(String title, String body, Map<String, Object> data) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", title);
            payload.put("body", body);
            payload.put("data", data != null ? data : new HashMap<>());
            payload.put("timestamp", System.currentTimeMillis());
            return json.writeValueAsString(payload);
        } catch (Exception exceptionValue17) {
            log.error("Failed to build push payload", exceptionValue17);
            return "{\"title\":\"UniQueue\",\"body\":\"You have a new notification\"}";
        }
    }
}