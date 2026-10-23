package com.uniqueeue.service;

import com.uniqueeue.dto.request.LoginRequest;
import com.uniqueeue.dto.request.RegisterRequest;
import com.uniqueeue.dto.response.AuthResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.RegistrationStatus;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.exception.UnauthorizedException;
import com.uniqueeue.model.AdmittedStudent;
import com.uniqueeue.model.PasswordResetToken;
import com.uniqueeue.model.StudentRegistry;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.PasswordResetTokenRepository;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.JwtTokenProvider;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.util.EmailNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final long RESET_TOKEN_TTL_MINUTES = 30;
    private static final long VERIFICATION_TTL_HOURS = 24;
    private static final int MAX_VERIFICATION_ATTEMPTS = 5;
    private static final long RESEND_COOLDOWN_SECONDS = 30;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MatricValidationService matricValidationService;
    private final AdmittedStudentService admittedStudentService;
    private final StudentRegistryService studentRegistryService;
    private final EmailService emailService;

    @Value("${app.security.log-verification-codes:false}")
    private boolean logVerificationCodes;

    // ============================================================
    //  REGISTER
    // ============================================================

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = EmailNormalizer.normalize(request.getEmail());
        if (email == null) throw new BadRequestException("Invalid email address");
        String fullName = request.getSubmittedFullName();
        if (fullName == null || fullName.isBlank()) throw new BadRequestException("First name and last name are required");

        if (userRepository.existsByEmail(email)) return handleExistingRegistration(email, request);

        University university = resolveUniversity(request);
        if (!Boolean.TRUE.equals(university.getIsActive())) throw new BadRequestException("University is not active");

        boolean isFresher = "FRESHER".equalsIgnoreCase(request.getAccountType() == null ? "STUDENT" : request.getAccountType().trim());
        return isFresher ? registerFresher(request, email, university) : registerStudent(request, email, university);
    }

    private AuthResponse handleExistingRegistration(String email, RegisterRequest request) {
        var existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null && Boolean.FALSE.equals(existing.getIsVerified())) {
            String code = String.format("%06d", RANDOM.nextInt(1_000_000));
            existing.setVerificationToken(code);
            existing.setVerificationAttempts(0);
            existing.setVerificationExpiresAt(LocalDateTime.now().plusHours(VERIFICATION_TTL_HOURS));
            existing.setLastVerificationSentAt(LocalDateTime.now());
            userRepository.save(existing);
            emailService.sendVerificationCode(existing, code);
            logCodeForDev("RESEND code", email, code);
        }
        return AuthResponse.builder().tokenType("Bearer").isVerified(false).build();
    }

    private University resolveUniversity(RegisterRequest request) {
        University university;
        if (request.getUniversityId() != null) {
            university = universityRepository.findById(request.getUniversityId()).orElseThrow(() -> new BadRequestException("University not found"));
        } else if (request.getUniversityCode() != null && !request.getUniversityCode().isBlank()) {
            university = universityRepository.findByCode(request.getUniversityCode().trim().toUpperCase()).orElseThrow(() -> new BadRequestException("University not found"));
        } else {
            throw new BadRequestException("Please select your university");
        }
        if (!Boolean.TRUE.equals(university.getIsActive())) throw new BadRequestException("This university is currently inactive");
        return university;
    }

    private AuthResponse registerStudent(RegisterRequest request, String email, University university) {
        if (university.getEmailDomain() != null && !university.getEmailDomain().isBlank()) {
            String domain = university.getEmailDomain().startsWith("@") ? university.getEmailDomain() : "@" + university.getEmailDomain();
            if (!email.endsWith(domain.toLowerCase())) throw new BadRequestException("Email must end with " + domain);
        }
        if (request.getMatricNumber() == null || request.getMatricNumber().isBlank()) throw new BadRequestException("Matric number is required");
        matricValidationService.validate(request.getMatricNumber(), university);
        String matric = request.getMatricNumber().trim();
        if (userRepository.existsByUniversityIdAndMatricNumber(university.getId(), matric)) throw new BadRequestException("Matric number already registered at this university");

        String mode = university.getMatricVerificationMode() == null ? "PATTERN" : university.getMatricVerificationMode().toUpperCase();
        RegistrationStatus status;
        StudentRegistry matched = null;

        if ("LIST".equals(mode) || "BOTH".equals(mode)) {
            Optional<StudentRegistry> hit = studentRegistryService.matchByMatric(university, matric);
            if (hit.isEmpty()) throw new BadRequestException("We couldn't find your matric number on the university's student registry.");
            matched = hit.get();
            status = namesEquivalent(matched.getFullName(), request.getSubmittedFullName()) ? RegistrationStatus.VERIFIED : RegistrationStatus.PENDING;
        } else if ("OPEN".equals(mode)) {
            status = RegistrationStatus.VERIFIED;
        } else {
            status = RegistrationStatus.PENDING;
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        User user = User.builder()
                .email(email).password(passwordEncoder.encode(request.getPassword())).fullName(request.getSubmittedFullName().trim())
                .role(Role.USER).university(university).matricNumber(matric).department(request.getDepartment()).phone(request.getPhone())
                .isActive(true).isVerified(false).registrationStatus(status).verificationToken(code).verificationAttempts(0)
                .verificationExpiresAt(LocalDateTime.now().plusHours(VERIFICATION_TTL_HOURS)).lastVerificationSentAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        if (matched != null) studentRegistryService.markClaimed(matched.getId(), saved);
        emailService.sendVerificationCode(saved, code);
        auditService.record(saved.getId(), university.getId(), AuditAction.USER_REGISTERED, "User", saved.getId(), "{\"registrationStatus\":\"" + status + "\"}");
        logCodeForDev("Verification code", saved.getEmail(), code);
        return buildAuthResponse(saved, code);
    }

    private AuthResponse registerFresher(RegisterRequest request, String email, University university) {
        if (Boolean.FALSE.equals(university.getFresherRegistrationEnabled())) throw new BadRequestException("Fresher registration is currently disabled.");
        validateFresherPatterns(request, university);
        String mode = university.getFresherVerificationMode() == null ? "PATTERN" : university.getFresherVerificationMode().toUpperCase();
        AdmittedStudent matched = null;

        if ("LIST".equals(mode) || "BOTH".equals(mode)) {
            matched = admittedStudentService.matchFresher(university, request);
            if (matched == null) throw new BadRequestException("We couldn't find your details on the admission list.");
        }
        if (request.getJambRegNumber() != null && !request.getJambRegNumber().isBlank()) {
            if (userRepository.existsByJambRegNumber(request.getJambRegNumber().trim())) throw new BadRequestException("This JAMB registration number is already registered");
        }
        RegistrationStatus regStatus = matched != null ? RegistrationStatus.VERIFIED : RegistrationStatus.PENDING;
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        User user = User.builder()
                .email(email).password(passwordEncoder.encode(request.getPassword())).fullName(request.getSubmittedFullName().trim())
                .role(Role.FRESHER).university(university).department(request.getDepartment()).phone(request.getPhone())
                .jambRegNumber(trimOrNull(request.getJambRegNumber())).admissionRef(trimOrNull(request.getAdmissionRef()))
                .applicationNumber(trimOrNull(request.getApplicationNumber())).admittedStudentId(matched != null ? matched.getId() : null)
                .isActive(true).isVerified(false).registrationStatus(regStatus).verificationToken(code).verificationAttempts(0)
                .verificationExpiresAt(LocalDateTime.now().plusHours(VERIFICATION_TTL_HOURS)).lastVerificationSentAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        if (matched != null) admittedStudentService.markClaimed(matched.getId(), saved);
        emailService.sendVerificationCode(saved, code);
        auditService.record(saved.getId(), university.getId(), AuditAction.USER_REGISTERED, "User", saved.getId(), "{\"role\":\"FRESHER\",\"matched\":" + (matched != null) + "}");
        logCodeForDev("Fresher verification code", saved.getEmail(), code);
        return buildAuthResponse(saved, code);
    }

    private void validateFresherPatterns(RegisterRequest req, University university) {
        if (Boolean.TRUE.equals(university.getRequireJambReg())) {
            requireNonBlank(req.getJambRegNumber(), "JAMB registration number is required");
            validatePattern(req.getJambRegNumber(), university.getJambRegPattern(), "JAMB registration number", university);
        }
        if (Boolean.TRUE.equals(university.getRequireAdmissionRef())) {
            requireNonBlank(req.getAdmissionRef(), "Admission reference is required");
            validatePattern(req.getAdmissionRef(), university.getAdmissionRefPattern(), "Admission reference", university);
        }
        if (Boolean.TRUE.equals(university.getRequireApplicationNumber())) {
            requireNonBlank(req.getApplicationNumber(), "Application number is required");
            validatePattern(req.getApplicationNumber(), university.getApplicationNumberPattern(), "Application number", university);
        }
    }

    private void requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) throw new BadRequestException(message);
    }

    private void validatePattern(String value, String pattern, String label, University university) {
        if (pattern == null || pattern.isBlank()) return;
        try {
            if (!Pattern.compile(pattern).matcher(value.trim()).matches()) {
                String hint = university.getJambRegExample() != null ? " Expected format: " + university.getJambRegExample() : "";
                throw new BadRequestException(label + " format is invalid." + hint);
            }
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Bad regex pattern for {}: {}", label, pattern);
        }
    }

    private String trimOrNull(String value) {
        return value == null ? null : (value.isBlank() ? null : value.trim());
    }

    private boolean namesEquivalent(String firstName, String secondName) {
        if (firstName == null || secondName == null) return false;
        return normalizeName(firstName).equals(normalizeName(secondName));
    }

    private String normalizeName(String name) {
        String[] tokens = name.toLowerCase().trim().split("\\s+");
        Arrays.sort(tokens);
        return String.join(" ", tokens);
    }

    // ============================================================
    //  LOGIN
    // ============================================================

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = EmailNormalizer.normalize(request.getEmail());
        if (email == null) throw new BadCredentialsException("Invalid email or password");

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (BadCredentialsException ex) {
            auditService.record(null, null, AuditAction.USER_LOGIN_FAILED, "User", null, "{\"email\":\"" + email + "\"}");
            throw ex;
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(principal.getEmail()).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getUniversity() != null && !Boolean.TRUE.equals(user.getUniversity().getIsActive())) throw new UnauthorizedException("Your university's account is currently inactive. Contact support.");
        if (!Boolean.TRUE.equals(user.getIsActive())) throw new UnauthorizedException("Your account has been disabled.");
        if (!Boolean.TRUE.equals(user.getIsVerified())) throw new BadRequestException("Your email is not verified. Please enter the 6-digit code sent to your email, or request a new one from the verification page.");

        auditService.record(user.getId(), user.getUniversity() != null ? user.getUniversity().getId() : null, AuditAction.USER_LOGIN, "User", user.getId(), null);
        return buildAuthResponse(user, null);
    }

    // ============================================================
    //  EMAIL VERIFICATION
    // ============================================================

    @Transactional(noRollbackFor = {BadRequestException.class, UnauthorizedException.class})
    public AuthResponse verifyEmail(String email, String code) {
        String lowerEmail = EmailNormalizer.normalize(email);
        if (lowerEmail == null || code == null || code.isBlank()) throw new BadRequestException("Invalid verification code");
        User user = userRepository.findByEmail(lowerEmail).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!Boolean.TRUE.equals(user.getIsActive())) throw new UnauthorizedException("Your account has been disabled.");
        if (Boolean.TRUE.equals(user.getIsVerified())) throw new BadRequestException("This email is already verified");
        if (user.getVerificationToken() == null || user.getVerificationToken().isBlank()) throw new BadRequestException("No verification code on file. Please request a new one.");
        if (user.getVerificationExpiresAt() != null && user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) throw new BadRequestException("Your verification code has expired. Please request a new one.");

        int attempts = user.getVerificationAttempts() != null ? user.getVerificationAttempts() : 0;
        if (attempts >= MAX_VERIFICATION_ATTEMPTS) throw new BadRequestException("Too many incorrect attempts. Please request a new verification code.");
        if (!user.getVerificationToken().equals(code.trim())) {
            user.setVerificationAttempts(attempts + 1);
            userRepository.save(user);
            int remaining = MAX_VERIFICATION_ATTEMPTS - (attempts + 1);
            if (remaining <= 0) throw new BadRequestException("Too many incorrect attempts. Please request a new verification code.");
            throw new BadRequestException("Invalid verification code. " + remaining + " attempt" + (remaining == 1 ? "" : "s") + " remaining.");
        }

        user.setIsVerified(true);
        user.setVerificationToken(null);
        user.setVerificationAttempts(0);
        user.setVerificationExpiresAt(null);
        userRepository.save(user);
        log.info("Email verified for {}", user.getEmail());
        return buildAuthResponse(user, null);
    }

    @Transactional
    public String resendVerification(String email) {
        String lowerEmail = EmailNormalizer.normalize(email);
        if (lowerEmail == null) throw new BadRequestException("Invalid email address");
        User user = userRepository.findByEmail(lowerEmail).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (Boolean.TRUE.equals(user.getIsVerified())) throw new BadRequestException("This email is already verified");
        if (!Boolean.TRUE.equals(user.getIsActive())) throw new UnauthorizedException("Your account has been disabled.");
        if (user.getLastVerificationSentAt() != null && user.getLastVerificationSentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) throw new BadRequestException("Please wait a moment before requesting another code.");

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setVerificationToken(code);
        user.setVerificationAttempts(0);
        user.setVerificationExpiresAt(LocalDateTime.now().plusHours(VERIFICATION_TTL_HOURS));
        user.setLastVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);
        emailService.sendVerificationCode(user, code);
        logCodeForDev("New verification code", user.getEmail(), code);
        return code;
    }

    // ============================================================
    //  PASSWORD RESET & SETUP
    // ============================================================

    @Transactional
    public String requestPasswordReset(String email) {
        String lowerEmail = EmailNormalizer.normalize(email);
        if (lowerEmail == null) return null;
        var userOpt = userRepository.findByEmail(lowerEmail);
        if (userOpt.isEmpty()) { log.info("Password reset requested for unknown email: {}", lowerEmail); return null; }

        User user = userOpt.get();
        passwordResetTokenRepository.deleteByUserId(user.getId());
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken prt = PasswordResetToken.builder().token(token).user(user).expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_TTL_MINUTES)).build();
        passwordResetTokenRepository.save(prt);
        emailService.sendPasswordReset(user, token);

        if (logVerificationCodes) log.info("🔐 [DEV-ONLY] Password reset link for {}: /reset-password?token={}", user.getEmail(), token);
        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) throw new BadRequestException("Invalid or expired reset link");
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token).orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));
        if (prt.isUsed()) throw new BadRequestException("This reset link has already been used");
        if (prt.isExpired()) throw new BadRequestException("This reset link has expired. Please request a new one.");
        User user = prt.getUser();
        if (!Boolean.TRUE.equals(user.getIsActive())) throw new UnauthorizedException("Your account has been disabled.");

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion((user.getTokenVersion() != null ? user.getTokenVersion() : 0) + 1);
        userRepository.save(user);
        prt.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(prt);
        log.info("Password reset successfully for {}", user.getEmail());
    }

    // 🔧 NEW: Setup Account Flow for new Admins
    @Transactional
    public void setupAccount(String token, String newPassword) {
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) throw new BadRequestException("Invalid or expired setup link");
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token).orElseThrow(() -> new BadRequestException("Invalid or expired setup link"));
        if (prt.isUsed()) throw new BadRequestException("This setup link has already been used");
        if (prt.isExpired()) throw new BadRequestException("This setup link has expired. Please request a new one.");
        User user = prt.getUser();
        if (!Boolean.TRUE.equals(user.getIsActive())) throw new UnauthorizedException("Your account has been disabled.");

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion((user.getTokenVersion() != null ? user.getTokenVersion() : 0) + 1);
        user.setIsVerified(true); // Ensure they are verified
        userRepository.save(user);
        prt.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(prt);
        log.info("Account setup completed successfully for {}", user.getEmail());
    }

    // ============================================================
    //  REFRESH & SIGN OUT
    // ============================================================

    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank() || !tokenProvider.validateToken(refreshToken)) throw new UnauthorizedException("Invalid or expired session. Please sign in again.");
        if (!JwtTokenProvider.TYPE_REFRESH.equals(tokenProvider.getTokenType(refreshToken))) throw new UnauthorizedException("Invalid session token.");
        String email = EmailNormalizer.normalize(tokenProvider.getEmailFromToken(refreshToken));
        if (email == null) throw new UnauthorizedException("Invalid session token.");

        User user = userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Invalid session token."));
        Integer tvFromToken = tokenProvider.getTokenVersionFromToken(refreshToken);
        Integer currentTv = user.getTokenVersion() != null ? user.getTokenVersion() : 0;
        if (!currentTv.equals(tvFromToken)) throw new UnauthorizedException("Your session has been invalidated. Please sign in again.");
        if (!Boolean.TRUE.equals(user.getIsActive())) throw new UnauthorizedException("Your account has been disabled.");
        if (user.getUniversity() != null && !Boolean.TRUE.equals(user.getUniversity().getIsActive())) throw new UnauthorizedException("Your university's account is inactive.");
        return buildAuthResponse(user, null);
    }

    @Transactional
    public void signOutAllDevices(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setTokenVersion((user.getTokenVersion() != null ? user.getTokenVersion() : 0) + 1);
        userRepository.save(user);
        log.info("Signed out all devices for user {} ({})", user.getEmail(), user.getId());
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private void logCodeForDev(String label, String email, String code) {
        if (logVerificationCodes) log.info("🔐 [DEV-ONLY] {} for {}: {}", label, email, code);
    }

    private AuthResponse buildAuthResponse(User user, String devVerificationCode) {
        UserPrincipal principal = new UserPrincipal(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        String accessToken = tokenProvider.generateToken(auth);
        String refreshToken = tokenProvider.generateRefreshToken(auth);

        return AuthResponse.builder()
                .accessToken(accessToken).refreshToken(refreshToken).tokenType("Bearer")
                .expiresIn(tokenProvider.getJwtExpirationMs() / 1000)
                .userId(user.getId()).email(user.getEmail()).fullName(user.getFullName())
                .role(user.getRole()).universityId(user.getUniversity() != null ? user.getUniversity().getId() : null)
                .isVerified(user.getIsVerified()).registrationStatus(user.getRegistrationStatus())
                .devVerificationCode(logVerificationCodes ? devVerificationCode : null)
                .build();
    }
}