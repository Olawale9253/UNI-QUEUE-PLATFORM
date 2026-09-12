package com.uniqueeue.service;

import com.uniqueeue.dto.response.AuditLogResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.model.AuditLog;
import com.uniqueeue.repository.AuditLogRepository;
import com.uniqueeue.utils.RequestUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final PlatformTransactionManager transactionManager;

    /**
     * Records an audit event in a fully isolated transaction.
     *
     * Uses TransactionTemplate directly — bypasses AOP so a failure cannot
     * mark the caller's transaction as rollback-only, regardless of how the
     * underlying JPA provider handles constraint violations.
     */
    public void record(Long userId, Long universityId, AuditAction action,
                       String entityType, Long entityId, String details) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            template.executeWithoutResult(status -> {
                AuditLog entry = AuditLog.builder()
                        .userId(userId)
                        .universityId(universityId)
                        .action(action)
                        .entityType(entityType)
                        .entityId(entityId)
                        .details(details)
                        .ipAddress(RequestUtils.getClientIp())
                        .build();
                auditLogRepository.saveAndFlush(entry);
            });
        } catch (Exception ex) {
            log.error("Audit log failed for action={} entity={}:{} — {}",
                    action, entityType, entityId, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(Long universityId, Long userId, AuditAction action,
                                         LocalDateTime from, LocalDateTime to,
                                         int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 200));
        return auditLogRepository
                .search(universityId, userId, action, from, to, pageable)
                .map(AuditLogResponse::from);
    }
}