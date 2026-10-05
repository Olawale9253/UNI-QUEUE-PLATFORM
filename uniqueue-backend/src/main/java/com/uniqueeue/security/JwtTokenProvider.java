package com.uniqueeue.security;

import com.uniqueeue.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return generateTokenFromPrincipal(principal, jwtExpirationMs, TYPE_ACCESS);
    }

    public String generateRefreshToken(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return generateTokenFromPrincipal(principal, refreshExpirationMs, TYPE_REFRESH);
    }

    public String generateTokenForUser(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        return generateTokenFromPrincipal(principal, jwtExpirationMs, TYPE_ACCESS);
    }

    private String generateTokenFromPrincipal(UserPrincipal principal, long expirationMs, String type) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(principal.getEmail())
                .claim("userId", principal.getId())
                .claim("role", principal.getRole().name())
                .claim("universityId", principal.getUniversityId())
                .claim("tv", principal.getTokenVersion())
                .claim("type", type)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public Integer getTokenVersionFromToken(String token) {
        Object tv = parseClaims(token).get("tv");
        return tv instanceof Number ? ((Number) tv).intValue() : 0;
    }

    public String getTokenType(String token) {
        Object t = parseClaims(token).get("type");
        return t != null ? t.toString() : TYPE_ACCESS;
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}