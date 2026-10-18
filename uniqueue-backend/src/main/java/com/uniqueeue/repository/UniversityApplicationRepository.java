package com.uniqueeue.repository;

import com.uniqueeue.model.UniversityApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversityApplicationRepository extends JpaRepository<UniversityApplication, Long> {

    Page<UniversityApplication> findByStatusOrderByCreatedAtDesc(
            UniversityApplication.Status status, Pageable pageable);

    Page<UniversityApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<UniversityApplication> findByAdminEmailAndStatus(
            String adminEmail, UniversityApplication.Status status);

    boolean existsByUniversityCodeAndStatus(
            String universityCode, UniversityApplication.Status status);

    long countByStatus(UniversityApplication.Status status);
}