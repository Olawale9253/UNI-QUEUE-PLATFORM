package com.uniqueeue.repository;

import com.uniqueeue.enums.Role;
import com.uniqueeue.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUniversityIdAndMatricNumber(Long universityId, String matricNumber);
    List<User> findByUniversityIdAndRole(Long universityId, Role role);
    List<User> findByUniversityId(Long universityId);

    /**
     * Global user search with optional filters.
     * Uses JOIN FETCH to eagerly load university — prevents LazyInitializationException
     * when GlobalUserResponse.from() accesses university data outside a session.
     *
     * Note: The count query is separate because JOIN FETCH is not allowed in count queries.
     */
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
}