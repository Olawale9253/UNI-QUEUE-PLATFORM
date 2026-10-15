package com.uniqueeue.repository.spec;

import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.model.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic filters for AuditLog. Only adds predicates for non-null params —
 * avoids the "? IS NULL OR col = ?" pattern that Hibernate 6 + Postgres
 * mishandles (unknown param type → bytea → function does not exist).
 */
public final class AuditLogSpecifications {

    private AuditLogSpecifications() {}

    public static Specification<AuditLog> withFilters(
            Long universityId,
            Long userId,
            AuditAction action,
            LocalDateTime from,
            LocalDateTime to) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (universityId != null) {
                predicates.add(cb.equal(root.get("universityId"), universityId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return predicates.isEmpty()
                    ? cb.conjunction()
                    : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}