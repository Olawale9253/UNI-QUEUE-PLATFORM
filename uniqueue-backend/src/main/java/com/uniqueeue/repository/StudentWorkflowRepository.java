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

    Optional<StudentWorkflow> findByStudentIdAndWorkflowId(Long studentId, Long workflowId);

    Optional<StudentWorkflow> findByStudentIdAndStatus(Long studentId, WorkflowStatus status);

    List<StudentWorkflow> findByWorkflowId(Long workflowId);

    long countByWorkflowIdAndStatus(Long workflowId, WorkflowStatus status);
}