package com.uniqueeue.ratelimit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniqueeue.exception.RateLimitExceededException;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.util.EmailNormalizer;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitAspect {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final RateLimitService rateLimitService;

    @Around("@annotation(rateLimited)")
    public Object check(ProceedingJoinPoint pjp, RateLimited rateLimited) throws Throwable {

        // 1. Primary limit
        enforce(
                rateLimited.keyType(),
                rateLimited.keyField(),
                rateLimited.name(),
                rateLimited.limit(),
                rateLimited.windowSeconds()
        );

        // 2. Optional secondary limit (e.g. IP + EMAIL on login)
        if (rateLimited.secondaryKeyType() != RateKeyType.NONE) {
            enforce(
                    rateLimited.secondaryKeyType(),
                    rateLimited.secondaryKeyField(),
                    rateLimited.name() + "-secondary",
                    rateLimited.secondaryLimit(),
                    rateLimited.secondaryWindowSeconds()
            );
        }

        return pjp.proceed();
    }

    private void enforce(RateKeyType keyType, String keyField, String name,
                         int limit, int windowSeconds) {
        String key = resolveKey(keyType, keyField);
        String bucketKey = keyType + ":" + key + ":" + name + ":" + limit + ":" + windowSeconds;

        long waitSeconds = rateLimitService.tryConsume(bucketKey, limit, windowSeconds);

        if (waitSeconds > 0) {
            String message = buildMessage(name, waitSeconds);
            log.warn("Rate limit hit: bucket={} limit={}/{}s wait={}s",
                    bucketKey, limit, windowSeconds, waitSeconds);
            throw new RateLimitExceededException(message, waitSeconds);
        }
    }

    private String buildMessage(String name, long waitSeconds) {
        String baseName = name != null && name.endsWith("-secondary")
                ? name.substring(0, name.length() - "-secondary".length())
                : name;
        String action = (baseName == null || baseName.isBlank()) ? "requests" : baseName + " attempts";
        return "Too many " + action + ". Try again in " + formatWait(waitSeconds) + ".";
    }

    private String formatWait(long seconds) {
        if (seconds < 60) {
            return seconds + " second" + (seconds == 1 ? "" : "s");
        }
        long minutes = (seconds + 59) / 60;
        if (minutes < 60) {
            return minutes + " minute" + (minutes == 1 ? "" : "s");
        }
        long hours = (minutes + 59) / 60;
        return hours + " hour" + (hours == 1 ? "" : "s");
    }

    private String resolveKey(RateKeyType keyType, String keyField) {
        return switch (keyType) {
            case IP    -> resolveIp();
            case EMAIL -> resolveEmail(keyField);
            case USER  -> resolveUserId();
            case NONE  -> "none";
        };
    }

    private String resolveIp() {
        HttpServletRequest req = currentRequest();
        if (req == null) return "unknown";

        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return comma > 0 ? xff.substring(0, comma).trim() : xff.trim();
        }
        return req.getRemoteAddr() != null ? req.getRemoteAddr() : "unknown";
    }

    private String resolveEmail(String field) {
        HttpServletRequest req = currentRequest();
        if (!(req instanceof CachedBodyHttpServletRequest cached)) {
            return "unknown";
        }
        try {
            JsonNode node = JSON.readTree(cached.getCachedBody());
            JsonNode emailNode = node.get(field);
            if (emailNode == null || emailNode.isNull()) return "unknown";
            String normalized = EmailNormalizer.normalize(emailNode.asText());
            return normalized != null ? normalized : "unknown";
        } catch (Exception exceptionValue2) {
            log.debug("Failed to extract {} from request body: {}", field, exceptionValue2.getMessage());
            return "unknown";
        }
    }

    private String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            return "anonymous";
        }
        return String.valueOf(principal.getId());
    }

    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }
}