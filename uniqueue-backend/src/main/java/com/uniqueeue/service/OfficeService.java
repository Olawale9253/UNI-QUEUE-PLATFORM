package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateOfficeRequest;
import com.uniqueeue.dto.response.OfficeResponse;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Office;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.University;
import com.uniqueeue.repository.OfficeRepository;
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OfficeService {

    private final OfficeRepository officeRepository;
    private final QueueRepository queueRepository;
    private final UniversityRepository universityRepository;

    @Transactional(readOnly = true)
    public List<OfficeResponse> list(Long universityId) {
        return officeRepository.findByUniversityIdOrderByNameAsc(universityId).stream()
                .map(this::enrich)
                .toList();
    }

    @Transactional(readOnly = true)
    public OfficeResponse getById(Long id, Long universityId) {
        Office officeValue = officeRepository.findByIdAndUniversityId(id, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Office not found"));
        return enrich(officeValue);
    }

    @Transactional
    public OfficeResponse create(Long universityId, CreateOfficeRequest request) {
        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        String name = request.getName().trim();
        if (officeRepository.existsByUniversityIdAndNameIgnoreCase(universityId, name)) {
            throw new BadRequestException("An office with this name already exists");
        }

        Office office = Office.builder()
                .university(university)
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .icon(request.getIcon())
                .openingTime(request.getOpeningTime() != null ? request.getOpeningTime() : java.time.LocalTime.of(9, 0))
                .closingTime(request.getClosingTime() != null ? request.getClosingTime() : java.time.LocalTime.of(17, 0))
                .slotDurationMinutes(request.getSlotDurationMinutes() != null ? request.getSlotDurationMinutes() : 15)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return enrich(officeRepository.save(office));
    }

    @Transactional
    public OfficeResponse update(Long id, Long universityId, CreateOfficeRequest request) {
        Office office = officeRepository.findByIdAndUniversityId(id, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Office not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(office.getName())
                    && officeRepository.existsByUniversityIdAndNameIgnoreCase(universityId, newName)) {
                throw new BadRequestException("Another office already uses this name");
            }
            office.setName(newName);
        }
        if (request.getDescription() != null) office.setDescription(request.getDescription().trim());
        if (request.getLocation() != null) office.setLocation(request.getLocation().trim());
        if (request.getIcon() != null) office.setIcon(request.getIcon());
        if (request.getOpeningTime() != null) office.setOpeningTime(request.getOpeningTime());
        if (request.getClosingTime() != null) office.setClosingTime(request.getClosingTime());
        if (request.getSlotDurationMinutes() != null) office.setSlotDurationMinutes(request.getSlotDurationMinutes());
        if (request.getIsActive() != null) office.setIsActive(request.getIsActive());

        return enrich(officeRepository.save(office));
    }

    @Transactional
    public void delete(Long id, Long universityId) {
        Office office = officeRepository.findByIdAndUniversityId(id, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Office not found"));

        // Block if any queue (service) is still attached
        List<Queue> services = queueRepository.findByOfficeId(id);
        if (!services.isEmpty()) {
            throw new BadRequestException(
                    "This office still has " + services.size() + " service(s). "
                            + "Move or delete them before removing the office.");
        }

        officeRepository.delete(office);
    }

    /**
     * Find an office by name, or create it on the fly. Used by QueueService
     * to gracefully handle the old free-text "department" input.
     */
    @Transactional
    public Office findOrCreateByName(Long universityId, String name) {
        String trimmed = name.trim();
        return officeRepository.findByUniversityIdAndNameIgnoreCase(universityId, trimmed)
                .orElseGet(() -> {
                    University university = universityRepository.findById(universityId)
                            .orElseThrow(() -> new ResourceNotFoundException("University not found"));
                    return officeRepository.save(Office.builder()
                            .university(university)
                            .name(trimmed)
                            .isActive(true)
                            .build());
                });
    }

    private OfficeResponse enrich(Office officeValue2) {
        OfficeResponse officeResponse = OfficeResponse.from(officeValue2);
        long serviceCount = queueRepository.countByOfficeId(officeValue2.getId());
        officeResponse.setServiceCount(serviceCount);
        officeResponse.setStaffCount(queueRepository.countDistinctStaffByOfficeId(officeValue2.getId()));
        officeResponse.setWaitingCount(queueRepository.countWaitingByOfficeId(officeValue2.getId()));
        return officeResponse;
    }
}