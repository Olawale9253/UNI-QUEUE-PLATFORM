package com.uniqueeue.repository;

import com.uniqueeue.model.UniversityClosedDate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface UniversityClosedDateRepository
        extends JpaRepository<UniversityClosedDate, Long> {

    boolean existsByUniversityIdAndClosedDate(Long universityId, LocalDate closedDate);

    List<UniversityClosedDate> findByUniversityIdAndClosedDateBetween(
            Long universityId, LocalDate from, LocalDate to);

    List<UniversityClosedDate> findByUniversityIdOrderByClosedDateAsc(Long universityId);
}