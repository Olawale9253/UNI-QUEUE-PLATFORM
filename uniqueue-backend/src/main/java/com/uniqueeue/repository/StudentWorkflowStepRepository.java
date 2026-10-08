package com.uniqueeue.repository;

import com.uniqueeue.enums.StepStatus;
import com.uniqueeue.model.StudentWorkflowStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentWorkflowStepRepository
        extends JpaRepository<StudentWorkflowStep, Long> {

    List<StudentWorkflowStep> findByStudentWorkflowIdOrderByWorkflowStepStepOrderAsc(
            Long studentWorkflowId);

    Optional<StudentWorkflowStep> findByStudentWorkflowIdAndWorkflowStepId(
            Long studentWorkflowId, Long workflowStepId);

    long countByStudentWorkflowIdAndStatus(Long studentWorkflowId, StepStatus status);

    /** For the admin dashboard — how many students are stuck on this step right now. */
    long countByWorkflowStepIdAndStatus(Long workflowStepId, StepStatus status);

    void deleteByStudentWorkflowId(Long studentWorkflowId);
}