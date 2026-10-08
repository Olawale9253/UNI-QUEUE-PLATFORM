package com.uniqueeue.model;

import com.uniqueeue.enums.StepStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "student_workflow_steps",
        uniqueConstraints = @UniqueConstraint(
                name = "unique_sw_step",
                columnNames = {"student_workflow_id", "workflow_step_id"}
        ),
        indexes = {
                @Index(name = "idx_sws_workflow", columnList = "student_workflow_id"),
                @Index(name = "idx_sws_status", columnList = "status")
        }
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentWorkflowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_workflow_id", nullable = false)
    private StudentWorkflow studentWorkflow;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_step_id", nullable = false)
    private WorkflowStep workflowStep;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private StepStatus status = StepStatus.PENDING;

    /** The ticket that completed this step. Null until completed. */
    @Column(name = "ticket_id")
    private Long ticketId;

    /** The staff member who served the ticket that completed this step. */
    @Column(name = "completed_by_user_id")
    private Long completedByUserId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /** Optional free-text notes (e.g. "Transcript ready in 3 days"). */
    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}