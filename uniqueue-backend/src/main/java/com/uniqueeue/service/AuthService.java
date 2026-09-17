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

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final long RESET_TOKEN_TTL_MINUTES = 30;
    private static final long VERIFICATION_TTL_HOURS = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MatricValidationService matricValidationService;

    // ============================================================
    //  REGISTER
    // ============================================================

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered");
        }

        University university = universityRepository.findById(request.getUniversityId())
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (!Boolean.TRUE.equals(university.getIsActive())) {
            throw new BadRequestException("University is not active");
        }

        // ── Email domain ──
        if (university.getEmailDomain() != null && !university.getEmailDomain().isBlank()) {
            String domain = university.getEmailDomain().startsWith("@")
                    ? university.getEmailDomain()
                    : "@" + university.getEmailDomain();
            if (!email.endsWith(domain.toLowerCase())) {
                throw new BadRequestException("Email must end with " + domain);
            }
        }

        // ── Matric format (strict, anchored) ──
        matricValidationService.validate(request.getMatricNumber(), university);

        // ── Matric uniqueness (per university) ──
        String matric = request.getMatricNumber().trim();
        if (userRepository.existsByUniversityIdAndMatricNumber(university.getId(), matric)) {
            throw new BadRequestException("Matric number already registered at this university");
        }

        // ── Generate 6-digit verification code ──
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(Role.USER)
                .university(university)
                .matricNumber(matric)
                .department(request.getDepartment())
                .phone(request.getPhone())
                .isActive(true)
                .isVerified(false)
                .verificationToken(code)
                .build();

        User saved = userRepository.save(user);

        auditService.record(saved.getId(), university.getId(),
                AuditAction.USER_REGISTERED, "User", saved.getId(), null);

        // Dev mode: log the code. In prod, send via email.
        log.info("🔐 Verification code for {}: {}", saved.getEmail(), code);

        return buildAuthResponse(saved, code);
    }

    // ============================================================
    //  LOGIN
    // ============================================================

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

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

        // ── Require email verification ──
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new UnauthorizedException(
                    "Your email is not verified. Please enter the 6-digit code sent to your email, "
                            + "or request a new one from the verification page.");
        }

        auditService.record(user.getId(),
                user.getUniversity() != null ? user.getUniversity().getId() : null,
                AuditAction.USER_LOGIN, "User", user.getId(), null);

        return buildAuthResponse(user, null);
    }

    // ============================================================
    //  EMAIL VERIFICATION
    // ============================================================

    @Transactional
    public AuthResponse verifyEmail(String email, String code) {
        String lowerEmail = email.toLowerCase().trim();
        User user = userRepository.findByEmail(lowerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("This email is already verified");
        }

        if (user.getVerificationToken() == null || user.getVerificationToken().isBlank()) {
            throw new BadRequestException(
                    "No verification code on file. Please request a new one.");
        }

        if (!user.getVerificationToken().equals(code.trim())) {
            throw new BadRequestException("Invalid verification code");
        }

        user.setIsVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        log.info("Email verified for {}", user.getEmail());
        return buildAuthResponse(user, null);
    }

    /**
     * Regenerates a verification code and returns it (dev mode).
     */
    @Transactional
    public String resendVerification(String email) {
        String lowerEmail = email.toLowerCase().trim();
        User user = userRepository.findByEmail(lowerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("This email is already verified");
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setVerificationToken(code);
        userRepository.save(user);

        log.info("🔐 New verification code for {}: {}", user.getEmail(), code);
        return code;
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

    private AuthResponse buildAuthResponse(User user, String devVerificationCode) {
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
                .isVerified(user.getIsVerified())
                .devVerificationCode(devVerificationCode) // only returned on register
                .build();
    }
}