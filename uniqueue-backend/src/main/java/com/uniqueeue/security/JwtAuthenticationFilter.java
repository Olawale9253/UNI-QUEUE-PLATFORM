package com.uniqueeue.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = extractToken(request);

            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {

                // Reject refresh tokens presented as access tokens.
                String type = tokenProvider.getTokenType(token);
                if (!JwtTokenProvider.TYPE_ACCESS.equals(type)) {
                    log.debug("Rejecting non-access token on protected route");
                    filterChain.doFilter(request, response);
                    return;
                }

                String email = tokenProvider.getEmailFromToken(token);
                Integer tokenTv = tokenProvider.getTokenVersionFromToken(token);

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                UserPrincipal principal = (UserPrincipal) userDetails;

                // Session invalidation: reject if the JWT's token version
                // doesn't match the DB. Triggers on password change / deactivation.
                if (principal.getTokenVersion() != null
                        && !principal.getTokenVersion().equals(tokenTv)) {
                    log.debug("Token version mismatch for {} — rejecting token", email);
                    filterChain.doFilter(request, response);
                    return;
                }

                // Reject inactive users immediately.
                if (!principal.isEnabled()) {
                    log.debug("Disabled user {} — rejecting token", email);
                    filterChain.doFilter(request, response);
                    return;
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}