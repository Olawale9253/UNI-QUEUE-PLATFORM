package com.uniqueeue.repository;

import com.uniqueeue.model.StudentRegistry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudentRegistryRepository extends JpaRepository<StudentRegistry, Long> {

    Page<StudentRegistry> findByUniversityId(Long universityId, Pageable pageable);
    long countByUniversityId(Long universityId);
    long countByUniversityIdAndClaimedByIsNull(Long universityId);
    void deleteByUniversityId(Long universityId);

    @Query("""
        SELECT r FROM StudentRegistry r
        WHERE r.university.id = :universityId
          AND LOWER(TRIM(r.matricNumber)) = LOWER(TRIM(:matric))
    """)
    Optional<StudentRegistry> findByUniversityAndMatric(
            @Param("universityId") Long universityId,
            @Param("matric") String matric);
}