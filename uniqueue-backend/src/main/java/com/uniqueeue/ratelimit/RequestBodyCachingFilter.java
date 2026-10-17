package com.uniqueeue.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Wraps incoming requests so their body can be re-read downstream.
 * IMPORTANT: Skips `multipart/form-data` requests to prevent breaking file uploads.
 */
@Component
@Order(1)
public class RequestBodyCachingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String method = request.getMethod();
        String contentType = request.getContentType();

        // If it's a file upload, bypass the caching wrapper entirely
        if (contentType != null && contentType.toLowerCase().startsWith("multipart/")) {
            chain.doFilter(request, response);
            return;
        }

        if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) {
            CachedBodyHttpServletRequest wrapped = new CachedBodyHttpServletRequest(request);
            chain.doFilter(wrapped, response);
        } else {
            chain.doFilter(request, response);
        }
    }
}