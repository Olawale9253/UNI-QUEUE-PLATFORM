package com.uniqueeue.repository;

import com.uniqueeue.model.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversityRepository extends JpaRepository<University, Long> {
    Optional<University> findByCode(String code);
    boolean existsByCode(String code);
}