package com.uniqueeue.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public final class RequestUtils {

    private RequestUtils() {}

    /** Returns the client IP, or null if not in a request context. */
    public static String getClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            HttpServletRequest request = attrs.getRequest();

            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            String real = request.getHeader("X-Real-IP");
            if (real != null && !real.isBlank()) return real;

            return request.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}