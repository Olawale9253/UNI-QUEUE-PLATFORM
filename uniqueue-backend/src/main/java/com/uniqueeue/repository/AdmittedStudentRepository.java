package com.uniqueeue.repository;

import com.uniqueeue.model.AdmittedStudent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AdmittedStudentRepository extends JpaRepository<AdmittedStudent, Long> {

    Page<AdmittedStudent> findByUniversityId(Long universityId, Pageable pageable);

    long countByUniversityId(Long universityId);

    long countByUniversityIdAndClaimedByIsNull(Long universityId);

    void deleteByUniversityId(Long universityId);

    // ─── Matching queries (case-insensitive, trimmed) ───

    @Query("""
        SELECT a FROM AdmittedStudent a
        WHERE a.university.id = :universityId
          AND LOWER(TRIM(a.jambRegNumber)) = LOWER(TRIM(:jambReg))
          AND a.claimedBy IS NULL
    """)
    Optional<AdmittedStudent> findUnclaimedByJambReg(
            @Param("universityId") Long universityId,
            @Param("jambReg") String jambReg);

    @Query("""
        SELECT a FROM AdmittedStudent a
        WHERE a.university.id = :universityId
          AND LOWER(TRIM(a.admissionRef)) = LOWER(TRIM(:ref))
          AND a.claimedBy IS NULL
    """)
    Optional<AdmittedStudent> findUnclaimedByAdmissionRef(
            @Param("universityId") Long universityId,
            @Param("ref") String ref);

    @Query("""
        SELECT a FROM AdmittedStudent a
        WHERE a.university.id = :universityId
          AND LOWER(TRIM(a.applicationNumber)) = LOWER(TRIM(:appNum))
          AND a.claimedBy IS NULL
    """)
    Optional<AdmittedStudent> findUnclaimedByApplicationNumber(
            @Param("universityId") Long universityId,
            @Param("appNum") String appNum);

    @Query("""
        SELECT a FROM AdmittedStudent a
        WHERE a.university.id = :universityId
          AND LOWER(TRIM(a.fullName)) = LOWER(TRIM(:fullName))
          AND a.claimedBy IS NULL
    """)
    List<AdmittedStudent> findUnclaimedByName(
            @Param("universityId") Long universityId,
            @Param("fullName") String fullName);
}