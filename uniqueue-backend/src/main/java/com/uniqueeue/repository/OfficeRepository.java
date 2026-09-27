package com.uniqueeue.repository;

import com.uniqueeue.model.Office;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OfficeRepository extends JpaRepository<Office, Long> {

    List<Office> findByUniversityIdOrderByNameAsc(Long universityId);

    List<Office> findByUniversityIdAndIsActiveTrueOrderByNameAsc(Long universityId);

    Optional<Office> findByIdAndUniversityId(Long id, Long universityId);

    Optional<Office> findByUniversityIdAndNameIgnoreCase(Long universityId, String name);

    boolean existsByUniversityIdAndNameIgnoreCase(Long universityId, String name);

    long countByUniversityId(Long universityId);
}