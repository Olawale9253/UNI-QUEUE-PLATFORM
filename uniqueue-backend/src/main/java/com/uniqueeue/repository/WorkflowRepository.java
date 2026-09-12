package com.uniqueeue.repository;

import com.uniqueeue.model.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {

    List<Workflow> findByUniversityIdOrderByCreatedAtDesc(Long universityId);

    List<Workflow> findByUniversityIdAndIsActiveTrueOrderByCreatedAtDesc(Long universityId);

    Optional<Workflow> findByIdAndUniversityId(Long id, Long universityId);
}