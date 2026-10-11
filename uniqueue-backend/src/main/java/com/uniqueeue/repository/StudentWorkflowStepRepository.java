package com.uniqueeue.repository;

import com.uniqueeue.enums.StepStatus;
import com.uniqueeue.model.StudentWorkflowStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentWorkflowStepRepository extends JpaRepository<StudentWorkflowStep, Long> {

    List<StudentWorkflowStep> findByStudentWorkflowIdOrderByWorkflowStepStepOrderAsc(Long studentWorkflowId);

    Optional<StudentWorkflowStep> findByStudentWorkflowIdAndWorkflowStepId(Long studentWorkflowId, Long workflowStepId);

    long countByStudentWorkflowIdAndStatus(Long studentWorkflowId, StepStatus status);

    long countByWorkflowStepIdAndStatus(Long workflowStepId, StepStatus status);

    void deleteByStudentWorkflowId(Long studentWorkflowId);

    List<StudentWorkflowStep> findByWorkflowStepIdAndStatusAndStartedAtIsNotNullAndCompletedAtIsNotNull(
            Long workflowStepId, StepStatus status);
}