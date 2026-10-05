package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.model.PushSubscription;
import com.uniqueeue.repository.PushSubscriptionRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.WebPushService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Push subscription lifecycle. Called by the frontend after the user grants
 * notification permission and the browser creates a subscription.
 */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
@Slf4j
public class PushController {

    private final PushSubscriptionRepository subscriptionRepository;
    private final WebPushService webPushService;

    /**
     * Save (or refresh) the browser's subscription for this user.
     * Called every time the frontend boots with a valid subscription.
     * Idempotent — same endpoint = upsert.
     */
    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> subscribe(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String endpoint = (String) body.get("endpoint");

        @SuppressWarnings("unchecked")
        Map<String, Object> keys = (Map<String, Object>) body.get("keys");
        String p256dh = keys != null ? (String) keys.get("p256dh") : null;
        String auth = keys != null ? (String) keys.get("auth") : null;

        if (endpoint == null || endpoint.isBlank()
                || p256dh == null || p256dh.isBlank()
                || auth == null || auth.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Missing endpoint or keys"));
        }

        // Upsert by endpoint. If it already exists, update the user (in case
        // the browser session changed) and the last_used_at.
        PushSubscription sub = subscriptionRepository.findByEndpoint(endpoint)
                .orElseGet(() -> PushSubscription.builder()
                        .endpoint(endpoint)
                        .build());

        sub.setUserId(principal.getId());
        sub.setP256dh(p256dh);
        sub.setAuth(auth);
        sub.setUserAgent(truncate(request.getHeader("User-Agent"), 250));

        subscriptionRepository.save(sub);

        Map<String, Object> data = new HashMap<>();
        data.put("ok", true);
        return ResponseEntity.ok(ApiResponse.success("Subscribed", data));
    }

    /**
     * Remove a specific subscription (the current browser's).
     */
    @DeleteMapping("/unsubscribe")
    public ResponseEntity<ApiResponse<Object>> unsubscribe(
            @RequestParam("endpoint") String endpoint,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (endpoint == null || endpoint.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("endpoint required"));
        }

        var existing = subscriptionRepository.findByEndpoint(endpoint);
        if (existing.isPresent() && existing.get().getUserId().equals(principal.getId())) {
            subscriptionRepository.delete(existing.get());
        }
        return ResponseEntity.ok(ApiResponse.success("Unsubscribed", null));
    }

    /**
     * Send a test push to the current user. Useful for a "Send test"
     * button in Settings.
     */
    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Object>> test(
            @AuthenticationPrincipal UserPrincipal principal) {
        webPushService.sendToUser(
                principal.getId(),
                "UniQueue test notification",
                "If you see this, push notifications are working.",
                Map.of("url", "/")
        );
        return ResponseEntity.ok(ApiResponse.success("Test push sent", null));
    }

    /**
     * For debugging — how many devices is this user subscribed on?
     */
    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<Map<String, Object>>> devices(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<PushSubscription> subs = subscriptionRepository.findByUserId(principal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("count", subs.size());
        data.put("devices", subs.stream().map(s -> Map.of(
                "id", s.getId(),
                "userAgent", s.getUserAgent() != null ? s.getUserAgent() : "unknown",
                "createdAt", s.getCreatedAt()
        )).toList());
        return ResponseEntity.ok(ApiResponse.success("Devices", data));
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}