package com.uniqueeue.repository;

import com.uniqueeue.enums.RegistrationStatus;
import com.uniqueeue.enums.Role;
import com.uniqueeue.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUniversityIdAndMatricNumber(Long universityId, String matricNumber);
    boolean existsByJambRegNumber(String jambRegNumber);
    List<User> findByUniversityIdAndRole(Long universityId, Role role);
    List<User> findByUniversityId(Long universityId);

    // ─────────────────────────────────────────────────────────────
    //  Global user search (super-admin "All Users" page)
    // ─────────────────────────────────────────────────────────────

    @Query(
            value = """
                    SELECT u FROM User u
                    LEFT JOIN FETCH u.university uni
                    WHERE (:universityId IS NULL OR uni.id = :universityId)
                      AND (:role IS NULL OR u.role = :role)
                      AND (:isActive IS NULL OR u.isActive = :isActive)
                      AND (:search IS NULL
                           OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.matricNumber) LIKE LOWER(CONCAT('%', :search, '%')))
                    ORDER BY u.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(u) FROM User u
                    LEFT JOIN u.university uni
                    WHERE (:universityId IS NULL OR uni.id = :universityId)
                      AND (:role IS NULL OR u.role = :role)
                      AND (:isActive IS NULL OR u.isActive = :isActive)
                      AND (:search IS NULL
                           OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.matricNumber) LIKE LOWER(CONCAT('%', :search, '%')))
                    """
    )
    Page<User> searchGlobalUsers(
            @Param("universityId") Long universityId,
            @Param("role") Role role,
            @Param("isActive") Boolean isActive,
            @Param("search") String search,
            Pageable pageable
    );

    long countByRole(Role role);
    long countByIsActive(Boolean isActive);

    // ─────────────────────────────────────────────────────────────
    //  Registration verification (NEW)
    // ─────────────────────────────────────────────────────────────

    @Query(
            value = """
                    SELECT u FROM User u
                    LEFT JOIN FETCH u.university uni
                    WHERE uni.id = :universityId
                      AND u.registrationStatus = :status
                      AND (:search IS NULL
                           OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.matricNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.jambRegNumber) LIKE LOWER(CONCAT('%', :search, '%')))
                    ORDER BY u.createdAt ASC
                    """,
            countQuery = """
                    SELECT COUNT(u) FROM User u
                    LEFT JOIN u.university uni
                    WHERE uni.id = :universityId
                      AND u.registrationStatus = :status
                      AND (:search IS NULL
                           OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.matricNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.jambRegNumber) LIKE LOWER(CONCAT('%', :search, '%')))
                    """
    )
    Page<User> searchPendingVerifications(
            @Param("universityId") Long universityId,
            @Param("status") RegistrationStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    long countByUniversityIdAndRegistrationStatus(Long universityId, RegistrationStatus status);

    // ─────────────────────────────────────────────────────────────
    //  Phase 5 — Cleanup support
    // ─────────────────────────────────────────────────────────────

    @Modifying
    @Query("""
            UPDATE User u
            SET u.verificationToken = null,
                u.verificationAttempts = 0,
                u.verificationExpiresAt = null
            WHERE u.isVerified = false
              AND u.verificationExpiresAt IS NOT NULL
              AND u.verificationExpiresAt < :cutoff
            """)
    int clearExpiredVerificationCodes(@Param("cutoff") LocalDateTime cutoff);

    @Query("""
            SELECT u FROM User u
            WHERE u.isVerified = false
              AND u.createdAt < :cutoff
            """)
    List<User> findUnverifiedOlderThan(@Param("cutoff") LocalDateTime cutoff);

    @Query("""
            SELECT COUNT(u) FROM User u
            WHERE u.isVerified = false
              AND u.createdAt < :cutoff
            """)
    long countUnverifiedOlderThan(@Param("cutoff") LocalDateTime cutoff);
}