-- ============================================================
--  V6: Student workflow step tracking
-- ============================================================

CREATE TABLE student_workflow_steps (
                                        id                    BIGSERIAL PRIMARY KEY,
                                        student_workflow_id   BIGINT       NOT NULL REFERENCES student_workflows(id) ON DELETE CASCADE,
                                        workflow_step_id      BIGINT       NOT NULL REFERENCES workflow_steps(id)   ON DELETE CASCADE,
                                        status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                                        ticket_id             BIGINT,
                                        completed_by_user_id  BIGINT,
                                        started_at            TIMESTAMP,
                                        completed_at          TIMESTAMP,
                                        notes                 TEXT,
                                        created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
                                        updated_at            TIMESTAMP,
                                        CONSTRAINT unique_sw_step UNIQUE (student_workflow_id, workflow_step_id)
);

CREATE INDEX idx_sws_workflow ON student_workflow_steps (student_workflow_id);
CREATE INDEX idx_sws_status   ON student_workflow_steps (status);