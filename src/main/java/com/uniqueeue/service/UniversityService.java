package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateAdminRequest;
import com.uniqueeue.dto.request.CreateUniversityRequest;
import com.uniqueeue.dto.request.UpdateUniversityRequest;
import com.uniqueeue.dto.response.UniversityResponse;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.TicketRepository;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UniversityService {

    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final QueueRepository queueRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UniversityResponse> listAll() {
        return universityRepository.findAll().stream()
                .map(this::enrich)
                .toList();
    }

    @Transactional(readOnly = true)
    public UniversityResponse getById(Long id) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        return enrich(u);
    }

    @Transactional
    public UniversityResponse create(CreateUniversityRequest request) {
        String code = request.getCode().toUpperCase();
        if (universityRepository.existsByCode(code)) {
            throw new BadRequestException("University code '" + code + "' already exists");
        }
        if (userRepository.existsByEmail(request.getAdminEmail().toLowerCase())) {
            throw new BadRequestException("Admin email is already registered");
        }

        University university = University.builder()
                .name(request.getName())
                .code(code)
                .emailDomain(request.getEmailDomain())
                .matricPattern(request.getMatricPattern())
                .matricExample(request.getMatricExample())
                .matricDescription(request.getMatricDescription())
                .logoUrl(request.getLogoUrl())
                .primaryColor(request.getPrimaryColor() != null ? request.getPrimaryColor() : "#3B82F6")
                .plan(request.getPlan() != null ? request.getPlan() : "FREE")
                .maxStaff(request.getMaxStaff() != null ? request.getMaxStaff() : 10)
                .maxQueues(request.getMaxQueues() != null ? request.getMaxQueues() : 5)
                .isActive(true)
                .build();

        university = universityRepository.save(university);

        User admin = User.builder()
                .email(request.getAdminEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .fullName(request.getAdminFullName())
                .role(Role.ADMIN)
                .university(university)
                .isActive(true)
                .isVerified(true)
                .build();
        userRepository.save(admin);

        return enrich(university);
    }

    @Transactional
    public UniversityResponse update(Long id, UpdateUniversityRequest request) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (request.getName() != null) u.setName(request.getName());
        if (request.getEmailDomain() != null) u.setEmailDomain(request.getEmailDomain());
        if (request.getMatricPattern() != null) u.setMatricPattern(request.getMatricPattern());
        if (request.getMatricExample() != null) u.setMatricExample(request.getMatricExample());
        if (request.getMatricDescription() != null) u.setMatricDescription(request.getMatricDescription());
        if (request.getLogoUrl() != null) u.setLogoUrl(request.getLogoUrl());
        if (request.getPrimaryColor() != null) u.setPrimaryColor(request.getPrimaryColor());
        if (request.getPlan() != null) u.setPlan(request.getPlan());
        if (request.getMaxStaff() != null) u.setMaxStaff(request.getMaxStaff());
        if (request.getMaxQueues() != null) u.setMaxQueues(request.getMaxQueues());
        if (request.getIsActive() != null) u.setIsActive(request.getIsActive());

        return enrich(universityRepository.save(u));
    }

    /**
     * Soft delete — preserves data, blocks logins.
     */
    @Transactional
    public UniversityResponse deactivate(Long id) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        u.setIsActive(false);
        University saved = universityRepository.save(u);
        log.info("Deactivated university id={} code={}", id, u.getCode());
        return enrich(saved);
    }

    /**
     * Reactivate a previously deactivated university.
     */
    @Transactional
    public UniversityResponse reactivate(Long id) {
        University u = universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        u.setIsActive(true);
        University saved = universityRepository.save(u);
        log.info("Reactivated university id={} code={}", id, u.getCode());
        return enrich(saved);
    }

    @Transactional
    public UniversityResponse createAdmin(Long universityId, CreateAdminRequest request) {
        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("Email already in use");
        }

        User admin = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.ADMIN)
                .university(university)
                .department(request.getDepartment())
                .phone(request.getPhone())
                .isActive(true)
                .isVerified(true)
                .build();
        userRepository.save(admin);

        return enrich(university);
    }

    private UniversityResponse enrich(University u) {
        UniversityResponse response = UniversityResponse.from(u);
        response.setQueueCount(queueRepository.countByUniversityId(u.getId()));
        response.setStaffCount((long) userRepository.findByUniversityIdAndRole(u.getId(), Role.STAFF).size());
        response.setUserCount((long) userRepository.findByUniversityIdAndRole(u.getId(), Role.USER).size());
        response.setTicketCount(ticketRepository.countByUniversity(u.getId()));
        return response;
    }
}