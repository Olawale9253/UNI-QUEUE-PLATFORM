package com.uniqueeue.repository;

import com.uniqueeue.model.WorkflowStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStepRepository extends JpaRepository<WorkflowStep, Long> {

    List<WorkflowStep> findByWorkflowIdOrderByStepOrderAsc(Long workflowId);

    Optional<WorkflowStep> findByWorkflowIdAndStepOrder(Long workflowId, Integer stepOrder);

    Optional<WorkflowStep> findByWorkflowIdAndQueueId(Long workflowId, Long queueId);

    long countByWorkflowId(Long workflowId);

    void deleteByWorkflowId(Long workflowId);
}