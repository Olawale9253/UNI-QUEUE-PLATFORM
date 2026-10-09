package com.uniqueeue.repository;

import com.uniqueeue.enums.WorkflowStatus;
import com.uniqueeue.model.StudentWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentWorkflowRepository extends JpaRepository<StudentWorkflow, Long> {

    List<StudentWorkflow> findByStudentIdOrderByStartedAtDesc(Long studentId);

    List<StudentWorkflow> findByWorkflowId(Long workflowId);

    Optional<StudentWorkflow> findByStudentIdAndWorkflowId(Long studentId, Long workflowId);

    long countByWorkflowIdAndStatus(Long workflowId, WorkflowStatus status);

    // ---- Phase A additions ----

    Optional<StudentWorkflow> findFirstByStudentIdAndStatusOrderByStartedAtDesc(
            Long studentId, WorkflowStatus status);

    Optional<StudentWorkflow> findFirstByStudentIdOrderByStartedAtDesc(Long studentId);
}