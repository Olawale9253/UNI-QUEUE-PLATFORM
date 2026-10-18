package com.uniqueeue.config;

import com.uniqueeue.security.CustomUserDetailsService;
import com.uniqueeue.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Unauthorized — authentication required\"}"
            );
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Forbidden — you don't have permission for this action\"}"
            );
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                .authorizeHttpRequests(auth -> auth
                        // ─── PUBLIC ENDPOINTS ───
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/universities",
                                "/api/auth/universities/lookup",
                                "/api/auth/validate-matric",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/verify-email",
                                "/api/auth/resend-verification",
                                "/api/auth/refresh",
                                "/api/public/**",
                                "/h2-console/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ─── PUBLIC FILE SERVING (GET only) ───
                        .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()

                        // ─── REAL-TIME EVENTS ───
                        .requestMatchers("/api/events/**").authenticated()

                        // ─── ROLE-SCOPED ───
                        .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/staff/**").hasRole("STAFF")
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "FRESHER")
                        .requestMatchers("/api/offices/**").hasAnyRole("USER", "FRESHER", "STAFF", "ADMIN")

                        // ─── EVERYTHING ELSE ───
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // ─── SECURITY HEADERS ───
                .headers(headers -> headers
                        // X-Content-Type-Options: nosniff — blocks MIME sniffing
                        .contentTypeOptions(Customizer.withDefaults())

                        // X-Frame-Options: SAMEORIGIN — blocks clickjacking, allows H2 console
                        .frameOptions(frame -> frame.sameOrigin())

                        // Strict-Transport-Security — force HTTPS for a year
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000))

                        // Referrer-Policy: no-referrer — never leak URLs to third parties
                        .referrerPolicy(r -> r.policy(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))

                        // Content-Security-Policy — the big one. Blocks inline/remote
                        // script injection on any response the backend serves.
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'none'; " +
                                        "script-src 'self'; " +
                                        "style-src 'self' 'unsafe-inline'; " +
                                        "img-src 'self' data:; " +
                                        "connect-src 'self'; " +
                                        "font-src 'self'; " +
                                        "object-src 'none'; " +
                                        "base-uri 'none'; " +
                                        "form-action 'self'; " +
                                        "frame-ancestors 'self'"
                        ))
                );

        return http.build();
    }
}