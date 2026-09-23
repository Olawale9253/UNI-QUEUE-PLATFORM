package com.uniqueeue.service;

import com.uniqueeue.dto.request.ChangePasswordRequest;
import com.uniqueeue.dto.request.UpdateProfileRequest;
import com.uniqueeue.dto.response.ProfileResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MatricValidationService matricValidationService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ProfileResponse.from(user);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        // ── Fresher → Student upgrade ──
        if (user.getRole() == Role.FRESHER
                && request.getMatricNumber() != null
                && !request.getMatricNumber().isBlank()) {

            String matric = request.getMatricNumber().trim();
            University university = user.getUniversity();

            if (university == null) {
                throw new BadRequestException("You are not attached to a university");
            }

            // Validate matric ONLY if the university has configured a pattern.
            // If no pattern is set, accept any reasonable format.
            if (university.getMatricPattern() != null
                    && !university.getMatricPattern().isBlank()) {
                matricValidationService.validate(matric, university);
            } else if (matric.length() < 3) {
                throw new BadRequestException("Matric number looks too short");
            }

            // Matric uniqueness per university
            if (userRepository.existsByUniversityIdAndMatricNumber(university.getId(), matric)) {
                throw new BadRequestException("This matric number is already registered at your university");
            }

            user.setMatricNumber(matric);
            user.setRole(Role.USER);
            user.setUpgradedToUserAt(LocalDateTime.now());

            log.info("Fresher {} upgraded to USER with matric {}", user.getEmail(), matric);

            auditService.record(user.getId(), university.getId(),
                    AuditAction.USER_REGISTERED, "User", user.getId(),
                    "{\"event\":\"fresher_upgraded\",\"matric\":\"" + matric + "\"}");
        }

        return ProfileResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from the current one");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}