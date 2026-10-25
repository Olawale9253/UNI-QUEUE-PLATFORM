package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.model.PushSubscription;
import com.uniqueeue.ratelimit.RateKeyType;
import com.uniqueeue.ratelimit.RateLimited;
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

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
@Slf4j
public class PushController {

    private final PushSubscriptionRepository subscriptionRepository;
    private final WebPushService webPushService;

    @PostMapping("/subscribe")
    @RateLimited(limit = 10, windowSeconds = 60, keyType = RateKeyType.USER, name = "push-subscribe")
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

    @PostMapping("/test")
    @RateLimited(limit = 3, windowSeconds = 60, keyType = RateKeyType.USER, name = "push-test")
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

    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<Map<String, Object>>> devices(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<PushSubscription> subs = subscriptionRepository.findByUserId(principal.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("count", subs.size());
        data.put("devices", subs.stream().map(pushSubscription -> Map.of(
                "id", pushSubscription.getId(),
                "userAgent", pushSubscription.getUserAgent() != null ? pushSubscription.getUserAgent() : "unknown",
                "createdAt", pushSubscription.getCreatedAt()
        )).toList());
        return ResponseEntity.ok(ApiResponse.success("Devices", data));
    }

    private String truncate(String stringValueValue, int max) {
        if (stringValueValue == null) return null;
        return stringValueValue.length() <= max ? stringValueValue : stringValueValue.substring(0, max);
    }
}