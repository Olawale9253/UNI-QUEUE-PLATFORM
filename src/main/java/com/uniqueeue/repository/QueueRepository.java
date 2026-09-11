package com.uniqueeue.repository;

import com.uniqueeue.model.Queue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueRepository extends JpaRepository<Queue, Long> {
    List<Queue> findByUniversityId(Long universityId);
    List<Queue> findByUniversityIdAndIsActiveTrue(Long universityId);
    Optional<Queue> findByIdAndUniversityId(Long id, Long universityId);
    long countByUniversityId(Long universityId);
}