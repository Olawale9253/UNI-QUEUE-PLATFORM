package com.uniqueeue.service;

import com.uniqueeue.dto.request.LoginRequest;
import com.uniqueeue.dto.request.RegisterRequest;
import com.uniqueeue.dto.response.AuthResponse;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.exception.UnauthorizedException;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.JwtTokenProvider;
import com.uniqueeue.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

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
        return buildAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase(),
                        request.getPassword()
                )
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Block login if the user belongs to an inactive university.
        if (user.getUniversity() != null
                && !Boolean.TRUE.equals(user.getUniversity().getIsActive())) {
            throw new UnauthorizedException(
                    "Your university's account is currently inactive. Contact support.");
        }

        // Block login if the user account itself is inactive.
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Your account has been disabled.");
        }

        return buildAuthResponse(user);
    }

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