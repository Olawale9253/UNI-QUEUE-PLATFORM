package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateClosedDateRequest;
import com.uniqueeue.dto.response.ClosedDateResponse;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.University;
import com.uniqueeue.model.UniversityClosedDate;
import com.uniqueeue.repository.UniversityClosedDateRepository;
import com.uniqueeue.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClosedDateService {

    private final UniversityClosedDateRepository closedDateRepository;
    private final UniversityRepository universityRepository;

    @Transactional(readOnly = true)
    public List<ClosedDateResponse> list(Long universityId) {
        return closedDateRepository
                .findByUniversityIdOrderByClosedDateAsc(universityId)
                .stream()
                .map(ClosedDateResponse::from)
                .toList();
    }

    @Transactional
    public ClosedDateResponse create(Long universityId, CreateClosedDateRequest req) {
        if (req.getClosedDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot mark a past date as closed");
        }
        if (closedDateRepository.existsByUniversityIdAndClosedDate(
                universityId, req.getClosedDate())) {
            throw new BadRequestException("That date is already marked as closed");
        }

        University uni = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        UniversityClosedDate entity = UniversityClosedDate.builder()
                .university(uni)
                .closedDate(req.getClosedDate())
                .reason(req.getReason() != null ? req.getReason().trim() : null)
                .build();

        return ClosedDateResponse.from(closedDateRepository.save(entity));
    }

    @Transactional
    public void delete(Long universityId, Long id) {
        UniversityClosedDate universityClosedDateValue = closedDateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Closed date not found"));

        if (!universityClosedDateValue.getUniversity().getId().equals(universityId)) {
            throw new BadRequestException("Closed date is not in your university");
        }
        closedDateRepository.delete(universityClosedDateValue);
    }

    /**
     * Checks if the university is physically open right now.
     * Returns false if:
     *   - The university account is disabled
     *   - It's Saturday or Sunday
     *   - Today is marked as a Closed Date (holiday/break)
     */
    @Transactional(readOnly = true)
    public boolean isUniversityOpen(University university) {
        if (!Boolean.TRUE.equals(university.getIsActive())) {
            return false;
        }

        ZoneId zone = ZoneId.of(university.getTimezone() != null ? university.getTimezone() : "Africa/Lagos");
        ZonedDateTime now = ZonedDateTime.now(zone);

        DayOfWeek day = now.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return false;
        }

        return !closedDateRepository.existsByUniversityIdAndClosedDate(
                university.getId(),
                now.toLocalDate()
        );
    }
}