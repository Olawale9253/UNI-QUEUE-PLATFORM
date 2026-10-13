package com.uniqueeue.security;

import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Centralized tenant isolation helpers.
 *
 * Any "fetch by ID" on a scoped resource MUST be followed by one of these
 * checks. Throw {@link ResourceNotFoundException} (HTTP 404), never 403,
 * so attackers can't tell "doesn't exist" from "belongs to another tenant".
 */
public final class TenantGuard {

    private TenantGuard() {}

    public static Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal userPrincipal)) return null;
        return userPrincipal.getId();
    }

    public static Long currentUniversityId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal userPrincipalValue)) return null;
        return userPrincipalValue.getUniversityId();
    }

    public static void requireOwner(Long ownerId, Long requestingUserId) {
        if (ownerId == null || !ownerId.equals(requestingUserId)) {
            throw new ResourceNotFoundException("Not found");
        }
    }

    public static void requireSameUniversity(Long resourceUniversityId, Long requestingUniversityId) {
        if (resourceUniversityId == null
                || requestingUniversityId == null
                || !resourceUniversityId.equals(requestingUniversityId)) {
            throw new ResourceNotFoundException("Not found");
        }
    }

    public static void requireSameUniversity(Queue queue, Long universityId) {
        requireSameUniversity(queue != null && queue.getUniversity() != null
                ? queue.getUniversity().getId() : null, universityId);
    }

    public static void requireSameUniversity(Ticket ticket, Long universityId) {
        Long resourceUniId = ticket != null
                && ticket.getQueue() != null
                && ticket.getQueue().getUniversity() != null
                ? ticket.getQueue().getUniversity().getId()
                : null;
        requireSameUniversity(resourceUniId, universityId);
    }

    public static void requireSameUniversity(User user, Long universityId) {
        Long resourceUniId = user != null && user.getUniversity() != null
                ? user.getUniversity().getId()
                : null;
        requireSameUniversity(resourceUniId, universityId);
    }
}