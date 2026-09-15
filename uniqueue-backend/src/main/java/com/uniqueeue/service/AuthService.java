package com.uniqueeue.service;

import com.uniqueeue.dto.request.LoginRequest;
import com.uniqueeue.dto.request.RegisterRequest;
import com.uniqueeue.dto.response.AuthResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.exception.UnauthorizedException;
import com.uniqueeue.model.PasswordResetToken;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.PasswordResetTokenRepository;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.JwtTokenProvider;
import com.uniqueeue.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final long RESET_TOKEN_TTL_MINUTES = 30;

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    // ============================================================
    //  REGISTER
    // ============================================================

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("Email is already registered");
        }

        University university = universityRepository.findById(request.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (!Boolean.TRUE.equals(university.getIsActive())) {
            throw new BadRequestException("University is not active");
        }

        if (university.getEmailDomain() != null && !university.getEmailDomain().isBlank()) {
            String domain = university.getEmailDomain().startsWith("@")
                    ? university.getEmailDomain()
                    : "@" + university.getEmailDomain();
            if (!request.getEmail().toLowerCase().endsWith(domain.toLowerCase())) {
                throw new BadRequestException("Email must end with " + domain);
            }
        }

        if (university.getMatricPattern() != null && !university.getMatricPattern().isBlank()) {
            if (!Pattern.matches(university.getMatricPattern(), request.getMatricNumber())) {
                String example = university.getMatricExample() != null
                        ? " Example: " + university.getMatricExample()
                        : "";
                throw new BadRequestException("Invalid matric number format." + example);
            }
        }

        if (userRepository.existsByUniversityIdAndMatricNumber(university.getId(), request.getMatricNumber())) {
            throw new BadRequestException("Matric number already registered at this university");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.USER)
                .university(university)
                .matricNumber(request.getMatricNumber())
                .department(request.getDepartment())
                .phone(request.getPhone())
                .isActive(true)
                .isVerified(false)
                .build();

        User saved = userRepository.save(user);

        auditService.record(saved.getId(), university.getId(),
                AuditAction.USER_REGISTERED, "User", saved.getId(), null);

        return buildAuthResponse(saved);
    }

    // ============================================================
    //  LOGIN
    // ============================================================

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase();

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (BadCredentialsException ex) {
            auditService.record(null, null, AuditAction.USER_LOGIN_FAILED, "User", null,
                    "{\"email\":\"" + email + "\"}");
            throw ex;
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getUniversity() != null
                && !Boolean.TRUE.equals(user.getUniversity().getIsActive())) {
            throw new UnauthorizedException(
                    "Your university's account is currently inactive. Contact support.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Your account has been disabled.");
        }

        auditService.record(user.getId(),
                user.getUniversity() != null ? user.getUniversity().getId() : null,
                AuditAction.USER_LOGIN, "User", user.getId(), null);

        return buildAuthResponse(user);
    }

    // ============================================================
    //  PASSWORD RESET
    // ============================================================

    @Transactional
    public String requestPasswordReset(String email) {
        String lowerEmail = email.toLowerCase();
        var userOpt = userRepository.findByEmail(lowerEmail);

        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", lowerEmail);
            return null;
        }

        User user = userOpt.get();

        passwordResetTokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        PasswordResetToken prt = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_TTL_MINUTES))
                .build();
        passwordResetTokenRepository.save(prt);

        log.info("🔐 Password reset link for {}: /reset-password?token={}",
                user.getEmail(), token);

        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (prt.isUsed()) {
            throw new BadRequestException("This reset link has already been used");
        }
        if (prt.isExpired()) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(prt);

        log.info("Password reset successfully for {}", user.getEmail());
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private AuthResponse buildAuthResponse(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());

        String accessToken = tokenProvider.generateToken(auth);
        String refreshToken = tokenProvider.generateRefreshToken(auth);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getJwtExpirationMs() / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .universityId(user.getUniversity() != null ? user.getUniversity().getId() : null)
                .build();
    }
}