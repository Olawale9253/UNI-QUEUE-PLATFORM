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

/**
 * Intercepts methods annotated with @RateLimited.
 * Resolves the bucket key based on keyType and delegates to RateLimitService.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitAspect {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final com.uniqueeue.ratelimit.RateLimitService rateLimitService;

    @Around("@annotation(rateLimited)")
    public Object check(ProceedingJoinPoint pjp, com.uniqueeue.ratelimit.RateLimited rateLimited) throws Throwable {
        String key = resolveKey(rateLimited);
        String bucketKey = rateLimited.keyType() + ":" + key + ":" + rateLimited.name();

        boolean allowed = rateLimitService.tryConsume(
                bucketKey,
                rateLimited.limit(),
                rateLimited.windowSeconds()
        );

        if (!allowed) {
            log.warn("Rate limit hit: bucket={} limit={}/{}s",
                    bucketKey, rateLimited.limit(), rateLimited.windowSeconds());
            throw new RateLimitExceededException(
                    "Too many requests. Please try again in a moment.",
                    rateLimited.windowSeconds()
            );
        }
        return pjp.proceed();
    }

    private String resolveKey(RateLimited rateLimited) {
        return switch (rateLimited.keyType()) {
            case IP    -> resolveIp();
            case EMAIL -> resolveEmail(rateLimited.keyField());
            case USER  -> resolveUserId();
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
        } catch (Exception e) {
            log.debug("Failed to extract {} from request body: {}", field, e.getMessage());
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