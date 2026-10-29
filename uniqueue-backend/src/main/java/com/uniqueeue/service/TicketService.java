package com.uniqueeue.service;

import com.uniqueeue.dto.response.QueueEstimateResponse;
import com.uniqueeue.dto.response.TicketResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.FeedbackRepository;
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.QueueStaffRepository;
import com.uniqueeue.repository.TicketRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.TenantGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TicketRepository ticketRepository;
    private final QueueRepository queueRepository;
    private final UserRepository userRepository;
    private final QueueStaffRepository queueStaffRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final WorkflowService workflowService;
    private final QueueScheduleService scheduleService;
    private final QueueService queueService;
    private final EmailService emailService;
    private final EventService eventService;

    // 🔧 ADDED: To check if a completed ticket has been rated
    private final FeedbackRepository feedbackRepository;

    // ============================================================
    //  STUDENT
    // ============================================================

    @Transactional
    public TicketResponse joinQueue(Long userId, Long queueId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));

        if (user.getUniversity() == null
                || !user.getUniversity().getId().equals(queue.getUniversity().getId())) {
            throw new BadRequestException("Queue is not in your university");
        }
        if (!Boolean.TRUE.equals(queue.getIsActive())) {
            throw new BadRequestException("Queue is not active");
        }
        if (!scheduleService.isWithinOperatingHours(queue)) {
            throw new BadRequestException(
                    "Queue is closed. Opens at " + queue.getOpensAt()
                            + ", closes at " + queue.getClosesAt() + ".");
        }

        workflowService.assertCanJoinQueue(userId, queueId);

        List<Ticket> active = ticketRepository.findActiveByUserId(userId);
        if (!active.isEmpty()) {
            throw new BadRequestException("You already have an active ticket");
        }

        long waitingCount = ticketRepository.findWaitingByQueueId(queueId).size();
        boolean queueFull = waitingCount >= queue.getMaxCapacity();

        TicketStatus initialStatus;
        if (!queueFull) {
            initialStatus = TicketStatus.WAITING;
        } else {
            if (!Boolean.TRUE.equals(queue.getAllowWaitlist())) {
                throw new BadRequestException("Queue is full");
            }
            long waitlistCount = ticketRepository.findWaitlistedByQueueId(queueId).size();
            int maxWaitlist = queue.getMaxWaitlistSize() != null ? queue.getMaxWaitlistSize() : 100;
            if (waitlistCount >= maxWaitlist) {
                throw new BadRequestException("Queue and waitlist are both full");
            }
            initialStatus = TicketStatus.WAITLISTED;
        }

        String ticketNumber = generateTicketNumber(queue);

        Ticket ticket = Ticket.builder()
                .queue(queue)
                .user(user)
                .ticketNumber(ticketNumber)
                .status(initialStatus)
                .priority(0)
                .build();
        ticket = ticketRepository.save(ticket);

        recalculatePositions(queueId);

        eventService.broadcastToUniversity(queue.getUniversity().getId(), "queue:updated",
                Map.of("queueId", queueId, "reason", "ticket-joined"));
        eventService.broadcastToUser(userId, "my-ticket:updated",
                Map.of("ticketId", ticket.getId(), "status", initialStatus.name()));

        Ticket fresh = ticketRepository.findById(ticket.getId()).orElseThrow();
        int pos = fresh.getPosition() != null ? fresh.getPosition() : 1;

        if (initialStatus == TicketStatus.WAITING) {
            notificationService.notify(user, NotificationType.QUEUE_UPDATE,
                    "You've joined " + queue.getName(),
                    "Ticket " + ticketNumber + " · Position " + pos + ". We'll notify you when it's your turn.");

            auditService.record(userId, queue.getUniversity().getId(),
                    AuditAction.TICKET_JOINED, "Ticket", ticket.getId(),
                    "{\"ticketNumber\":\"" + ticketNumber + "\",\"queueId\":" + queueId + "}");
        } else {
            notificationService.notify(user, NotificationType.QUEUE_UPDATE,
                    "You're on the waitlist for " + queue.getName(),
                    "Ticket " + ticketNumber + " · Waitlist #" + pos + ". We'll notify you when a slot opens.");

            auditService.record(userId, queue.getUniversity().getId(),
                    AuditAction.TICKET_WAITLISTED, "Ticket", ticket.getId(),
                    "{\"ticketNumber\":\"" + ticketNumber + "\",\"queueId\":" + queueId + "}");
        }

        return enrichWithPosition(fresh);
    }

    @Transactional(readOnly = true)
    public Optional<TicketResponse> getActiveTicket(Long userId) {
        // 1. Check for truly active tickets (WAITING, WAITLISTED, CALLED, SERVING)
        List<Ticket> active = ticketRepository.findActiveByUserId(userId);
        if (!active.isEmpty()) {
            return Optional.of(enrichWithPosition(active.get(0)));
        }

        // 2. Check for a recently completed ticket that hasn't been rated yet
        // This keeps the "Rate Service" prompt on the dashboard until the user submits feedback
        List<Ticket> history = ticketRepository.findByUserIdOrderByJoinedAtDesc(userId);
        if (!history.isEmpty()) {
            Ticket latest = history.get(0);
            if (latest.getStatus() == TicketStatus.COMPLETED) {
                // If no feedback exists for this ticket, return it so the UI can prompt for a rating
                if (!feedbackRepository.existsByTicketId(latest.getId())) {
                    return Optional.of(enrichWithPosition(latest));
                }
            }
        }

        return Optional.empty();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getHistory(Long userId) {
        return ticketRepository.findByUserIdOrderByJoinedAtDesc(userId).stream()
                .map(this::enrichWithPosition)
                .toList();
    }

    @Transactional
    public void leaveQueue(Long userId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (!ticket.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Ticket not found");
        }
        if (ticket.getStatus() != TicketStatus.WAITING
                && ticket.getStatus() != TicketStatus.WAITLISTED
                && ticket.getStatus() != TicketStatus.CALLED) {
            throw new BadRequestException("Cannot leave a ticket that is " + ticket.getStatus());
        }
        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.CANCELLED);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        if (oldStatus == TicketStatus.WAITING) {
            promoteFromWaitlist(ticket.getQueue().getId());
        }

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", ticket.getQueue().getId(), "reason", "ticket-cancelled"));
        eventService.broadcastToUser(userId, "my-ticket:updated",
                Map.of("ticketId", ticketId, "status", "CANCELLED"));

        auditService.record(userId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_CANCELLED, "Ticket", ticketId, null);
    }

    @Transactional
    public TicketResponse rescheduleMyTurn(Long userId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (!ticket.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Ticket not found");
        }
        if (ticket.getStatus() != TicketStatus.WAITING
                && ticket.getStatus() != TicketStatus.CALLED) {
            throw new BadRequestException(
                    "Only WAITING or CALLED tickets can be rescheduled. "
                            + "Your ticket is " + ticket.getStatus() + ".");
        }

        Long queueId = ticket.getQueue().getId();

        ticket.setStatus(TicketStatus.WAITING);
        ticket.setCalledAt(null);
        ticket.setServedBy(null);
        ticket.setPriority(0);
        ticket.setJoinedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        recalculatePositions(queueId);

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", queueId, "reason", "ticket-rescheduled"));
        eventService.broadcastToUser(userId, "my-ticket:updated",
                Map.of("ticketId", ticketId, "status", "WAITING"));

        notificationService.notify(ticket.getUser(), NotificationType.QUEUE_UPDATE,
                "Turn rescheduled",
                "You've been moved to the end of " + ticket.getQueue().getName()
                        + ". New ticket: " + ticket.getTicketNumber() + ".");

        auditService.record(userId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_RESCHEDULED, "Ticket", ticketId,
                "{\"ticketNumber\":\"" + ticket.getTicketNumber() + "\"}");

        Ticket fresh = ticketRepository.findById(ticketId).orElseThrow();
        return enrichWithPosition(fresh);
    }

    @Transactional
    public TicketResponse skipMyTurn(Long userId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (!ticket.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Ticket not found");
        }
        if (ticket.getStatus() != TicketStatus.WAITING
                && ticket.getStatus() != TicketStatus.CALLED) {
            throw new BadRequestException(
                    "Only WAITING or CALLED tickets can be skipped. "
                            + "Your ticket is " + ticket.getStatus() + ".");
        }

        TicketStatus oldStatus = ticket.getStatus();
        Long queueId = ticket.getQueue().getId();

        ticket.setStatus(TicketStatus.NO_SHOW);
        ticketRepository.save(ticket);
        recalculatePositions(queueId);

        if (oldStatus == TicketStatus.WAITING) {
            promoteFromWaitlist(queueId);
        }

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", queueId, "reason", "ticket-skipped"));
        eventService.broadcastToUser(userId, "my-ticket:updated",
                Map.of("ticketId", ticketId, "status", "NO_SHOW"));

        notificationService.notify(ticket.getUser(), NotificationType.QUEUE_UPDATE,
                "Turn skipped",
                "Your ticket " + ticket.getTicketNumber() + " has been marked as skipped. "
                        + "You can join the queue again anytime.");

        auditService.record(userId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_SKIPPED, "Ticket", ticketId,
                "{\"ticketNumber\":\"" + ticket.getTicketNumber() + "\"}");

        return enrichWithPosition(ticket);
    }

    // ============================================================
    //  STAFF
    // ============================================================

    @Transactional(readOnly = true)
    public List<com.uniqueeue.dto.response.QueueResponse> listMyQueues(Long staffUserId) {
        List<com.uniqueeue.model.QueueStaff> assignments = queueStaffRepository.findByUserId(staffUserId);
        return assignments.stream()
                .map(queueStaff -> queueService.enrichWithStaff(queueStaff.getQueue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> listQueueTickets(Long staffUserId, Long queueId) {
        ensureStaffOwnsQueue(staffUserId, queueId);
        return ticketRepository.findByQueueIdOrderByJoinedAtAsc(queueId).stream()
                .map(this::enrichWithPosition)
                .toList();
    }

    @Transactional
    public TicketResponse callNext(Long staffUserId, Long queueId) {
        ensureStaffOwnsQueue(staffUserId, queueId);
        User staff = userRepository.findById(staffUserId).orElseThrow();

        List<Ticket> called = ticketRepository.findCalledByQueueId(queueId);

        boolean hasActiveCalled = called.stream()
                .anyMatch(ticketValue24 -> ticketValue24.getCalledAt() != null
                        && ticketValue24.getCalledAt().toLocalDate().equals(LocalDate.now()));

        if (hasActiveCalled) {
            throw new BadRequestException("A ticket is already being called. Serve or no-show it first.");
        }

        List<Ticket> waiting = ticketRepository.findWaitingByQueueId(queueId);
        if (waiting.isEmpty()) {
            throw new BadRequestException("No waiting tickets");
        }

        Ticket next = waiting.get(0);
        next.setStatus(TicketStatus.CALLED);
        next.setCalledAt(LocalDateTime.now());
        next.setServedBy(staff);
        next.setPosition(null);
        ticketRepository.save(next);

        recalculatePositions(queueId);
        promoteFromWaitlist(queueId);

        Long uniId = next.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", queueId, "reason", "ticket-called"));
        eventService.broadcastToUser(next.getUser().getId(), "my-ticket:updated",
                Map.of("ticketId", next.getId(), "status", "CALLED"));

        notificationService.notify(next.getUser(), NotificationType.TICKET_CALLED,
                "It's your turn!",
                "Ticket " + next.getTicketNumber() + " is now being called at " + next.getQueue().getName() + ".");

        emailService.sendTicketCalled(next.getUser(), next, next.getQueue());

        auditService.record(staffUserId, next.getQueue().getUniversity().getId(),
                AuditAction.TICKET_CALLED, "Ticket", next.getId(),
                "{\"ticketNumber\":\"" + next.getTicketNumber() + "\"}");

        return enrichWithPosition(next);
    }

    @Transactional
    public TicketResponse callTicket(Long staffUserId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.WAITING) {
            throw new BadRequestException("Only WAITING tickets can be called");
        }
        User staff = userRepository.findById(staffUserId).orElseThrow();

        ticket.setStatus(TicketStatus.CALLED);
        ticket.setCalledAt(LocalDateTime.now());
        ticket.setServedBy(staff);
        ticket.setPosition(null);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());
        promoteFromWaitlist(ticket.getQueue().getId());

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", ticket.getQueue().getId(), "reason", "ticket-called"));
        eventService.broadcastToUser(ticket.getUser().getId(), "my-ticket:updated",
                Map.of("ticketId", ticket.getId(), "status", "CALLED"));

        notificationService.notify(ticket.getUser(), NotificationType.TICKET_CALLED,
                "It's your turn!",
                "Ticket " + ticket.getTicketNumber() + " is now being called.");

        emailService.sendTicketCalled(ticket.getUser(), ticket, ticket.getQueue());

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_CALLED, "Ticket", ticketId, null);

        return enrichWithPosition(ticket);
    }

    @Transactional
    public TicketResponse serveTicket(Long staffUserId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.CALLED) {
            throw new BadRequestException("Only CALLED tickets can be served");
        }
        ticket.setStatus(TicketStatus.SERVING);
        ticket.setServedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", ticket.getQueue().getId(), "reason", "ticket-served"));
        eventService.broadcastToUser(ticket.getUser().getId(), "my-ticket:updated",
                Map.of("ticketId", ticket.getId(), "status", "SERVING"));

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_SERVED, "Ticket", ticketId, null);

        return enrichWithPosition(ticket);
    }

    @Transactional
    public TicketResponse completeTicket(Long staffUserId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.SERVING) {
            throw new BadRequestException(
                    "Start the service before completing the ticket. "
                            + "Current status: " + ticket.getStatus() + ".");
        }
        ticket.setStatus(TicketStatus.COMPLETED);
        ticket.setCompletedAt(LocalDateTime.now());
        if (ticket.getServedBy() == null) {
            ticket.setServedBy(userRepository.findById(staffUserId).orElseThrow());
        }
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", ticket.getQueue().getId(), "reason", "ticket-completed"));
        eventService.broadcastToUser(ticket.getUser().getId(), "my-ticket:updated",
                Map.of("ticketId", ticket.getId(), "status", "COMPLETED"));

        workflowService.onTicketCompleted(ticket.getUser().getId(), ticket.getQueue().getId());

        notificationService.notify(ticket.getUser(), NotificationType.TICKET_SERVED,
                "Service complete",
                "Thanks for using UniQueue. Please rate your experience.");

        emailService.sendTicketCompleted(ticket.getUser(), ticket, ticket.getQueue());

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_COMPLETED, "Ticket", ticketId, null);

        return enrichWithPosition(ticket);
    }

    @Transactional
    public TicketResponse noShowTicket(Long staffUserId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.CALLED
                && ticket.getStatus() != TicketStatus.WAITING) {
            throw new BadRequestException("Only WAITING or CALLED tickets can be marked no-show");
        }
        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.NO_SHOW);
        ticket.setPosition(null);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        if (oldStatus == TicketStatus.WAITING) {
            promoteFromWaitlist(ticket.getQueue().getId());
        }

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", ticket.getQueue().getId(), "reason", "ticket-no-show"));
        eventService.broadcastToUser(ticket.getUser().getId(), "my-ticket:updated",
                Map.of("ticketId", ticket.getId(), "status", "NO_SHOW"));

        notificationService.notify(ticket.getUser(), NotificationType.SYSTEM,
                "You missed your turn",
                "Ticket " + ticket.getTicketNumber() + " was marked as a no-show.");

        emailService.sendTicketNoShow(ticket.getUser(), ticket, ticket.getQueue());

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_NO_SHOW, "Ticket", ticketId, null);

        return enrichWithPosition(ticket);
    }

    @Transactional
    public TicketResponse transferTicket(Long staffUserId, Long ticketId, String notes) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.WAITING) {
            throw new BadRequestException("Only WAITING tickets can be transferred");
        }
        ticket.setStatus(TicketStatus.TRANSFERRED);
        if (notes != null) ticket.setNotes(notes);
        ticket.setPosition(null);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());
        promoteFromWaitlist(ticket.getQueue().getId());

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", ticket.getQueue().getId(), "reason", "ticket-transferred"));
        eventService.broadcastToUser(ticket.getUser().getId(), "my-ticket:updated",
                Map.of("ticketId", ticket.getId(), "status", "TRANSFERRED"));

        notificationService.notify(ticket.getUser(), NotificationType.SYSTEM,
                "Ticket transferred",
                "Your ticket " + ticket.getTicketNumber() + " has been transferred to another desk.");

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_TRANSFERRED, "Ticket", ticketId, null);

        return enrichWithPosition(ticket);
    }

    // ============================================================
    //  PRIORITY
    // ============================================================

    @Transactional
    public TicketResponse setPriority(Long staffUserId, Long ticketId, int priority) {
        if (priority < 0 || priority > 100) {
            throw new BadRequestException("Priority must be between 0 and 100");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.WAITING
                && ticket.getStatus() != TicketStatus.WAITLISTED) {
            throw new BadRequestException("Only WAITING or WAITLISTED tickets can have their priority changed");
        }

        ticket.setPriority(priority);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        Long uniId = ticket.getQueue().getUniversity().getId();
        eventService.broadcastToUniversity(uniId, "queue:updated",
                Map.of("queueId", ticket.getQueue().getId(), "reason", "ticket-priority-changed"));

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_PRIORITY_CHANGED, "Ticket", ticketId,
                "{\"priority\":" + priority + "}");

        return enrichWithPosition(ticket);
    }

    // ============================================================
    //  ESTIMATE
    // ============================================================

    @Transactional(readOnly = true)
    public QueueEstimateResponse estimate(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));

        TenantGuard.requireSameUniversity(queue, TenantGuard.currentUniversityId());

        List<Ticket> waiting = ticketRepository.findWaitingByQueueId(queueId);
        List<Ticket> waitlisted = ticketRepository.findWaitlistedByQueueId(queueId);
        List<Ticket> called = ticketRepository.findCalledByQueueId(queueId);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<Ticket> todayDone = ticketRepository.findRecentByQueue(queueId, startOfDay).stream()
                .filter(ticketValue25 -> ticketValue25.getStatus() == TicketStatus.COMPLETED)
                .filter(ticketValue26 -> ticketValue26.getJoinedAt() != null && ticketValue26.getCalledAt() != null)
                .toList();

        double actualAvg = todayDone.isEmpty() ? 0
                : todayDone.stream()
                .mapToLong(ticketValue27 -> Duration.between(ticketValue27.getJoinedAt(), ticketValue27.getCalledAt()).toMinutes())
                .average().orElse(0);

        int perTicket = queue.getAverageServiceMinutes() != null ? queue.getAverageServiceMinutes() : 5;
        int estimateJoiner = Math.max(0, waiting.size() * perTicket);
        int estimateWaitlist = (waiting.size() + waitlisted.size()) * perTicket;

        boolean isFull = waiting.size() >= queue.getMaxCapacity();

        return QueueEstimateResponse.builder()
                .queueId(queue.getId())
                .queueName(queue.getName())
                .isOpen(scheduleService.isWithinOperatingHours(queue))
                .opensAt(queue.getOpensAt() != null ? queue.getOpensAt().toString() : null)
                .closesAt(queue.getClosesAt() != null ? queue.getClosesAt().toString() : null)
                .waitingCount(waiting.size())
                .waitlistCount(waitlisted.size())
                .activeCalledCount(called.size())
                .currentlyServing(called.isEmpty() ? null : called.get(0).getTicketNumber())
                .allowWaitlist(Boolean.TRUE.equals(queue.getAllowWaitlist()))
                .isFull(isFull)
                .configuredAvgMinutes(perTicket)
                .actualAvgMinutesToday(Math.round(actualAvg * 10.0) / 10.0)
                .estimatedMinutesForNewJoiner(estimateJoiner)
                .estimatedMinutesForWaitlisters(estimateWaitlist)
                .build();
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private String generateTicketNumber(Queue queue) {
        String prefix = String.valueOf(queue.getName().charAt(0)).toUpperCase();

        // Ensure prefix is a valid letter, fallback to 'T' for Ticket
        if (!prefix.matches("[A-Z]")) {
            prefix = "T";
        }

        for (int attempt = 0; attempt < 100; attempt++) {
            // Generate a random number between 0 and 9999
            int value = RANDOM.nextInt(10000);
            // Format as Q-0245
            String candidate = prefix + "-" + String.format("%04d", value);

            if (!ticketRepository.existsByTicketNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique ticket number after 100 attempts");
    }

    private void ensureStaffOwnsQueue(Long staffUserId, Long queueId) {
        if (!queueStaffRepository.existsByQueueIdAndUserId(queueId, staffUserId)) {
            throw new BadRequestException("You are not assigned to this queue");
        }
    }

    private void recalculatePositions(Long queueId) {
        List<Ticket> waiting = ticketRepository.findWaitingByQueueId(queueId);
        List<Ticket> toUpdate = new ArrayList<>();
        int pos = 1;
        for (Ticket ticketValue28 : waiting) {
            if (ticketValue28.getPosition() == null || ticketValue28.getPosition() != pos) {
                ticketValue28.setPosition(pos);
                toUpdate.add(ticketValue28);
            }
            pos++;
        }
        if (!toUpdate.isEmpty()) ticketRepository.saveAll(toUpdate);

        List<Ticket> waitlisted = ticketRepository.findWaitlistedByQueueId(queueId);
        List<Ticket> waitlistedToUpdate = new ArrayList<>();
        int wpos = 1;
        for (Ticket ticketValue29 : waitlisted) {
            if (ticketValue29.getPosition() == null || ticketValue29.getPosition() != wpos) {
                ticketValue29.setPosition(wpos);
                waitlistedToUpdate.add(ticketValue29);
            }
            wpos++;
        }
        if (!waitlistedToUpdate.isEmpty()) ticketRepository.saveAll(waitlistedToUpdate);
    }

    private void promoteFromWaitlist(Long queueId) {
        Queue queue = queueRepository.findById(queueId).orElse(null);
        if (queue == null) return;
        if (!Boolean.TRUE.equals(queue.getAllowWaitlist())) return;
        if (!Boolean.TRUE.equals(queue.getAutoPromoteWaitlist())) return;

        List<Ticket> waiting = ticketRepository.findWaitingByQueueId(queueId);
        int freeSlots = queue.getMaxCapacity() - waiting.size();
        if (freeSlots <= 0) return;

        List<Ticket> waitlisted = ticketRepository.findWaitlistedByQueueId(queueId);
        if (waitlisted.isEmpty()) return;

        int toPromote = Math.min(freeSlots, waitlisted.size());
        for (int indexValue7 = 0; indexValue7 < toPromote; indexValue7++) {
            Ticket ticketValue30 = waitlisted.get(indexValue7);
            ticketValue30.setStatus(TicketStatus.WAITING);
            ticketRepository.save(ticketValue30);

            notificationService.notify(ticketValue30.getUser(), NotificationType.QUEUE_UPDATE,
                    "A slot opened in " + queue.getName(),
                    "You've been moved off the waitlist. Ticket " + ticketValue30.getTicketNumber()
                            + " is now in the active queue.");

            auditService.record(null, queue.getUniversity().getId(),
                    AuditAction.TICKET_WAITLIST_PROMOTED, "Ticket", ticketValue30.getId(),
                    "{\"ticketNumber\":\"" + ticketValue30.getTicketNumber() + "\"}");
        }

        recalculatePositions(queueId);

        eventService.broadcastToUniversity(queue.getUniversity().getId(), "queue:updated",
                Map.of("queueId", queueId, "reason", "waitlist-promoted"));
    }

    private TicketResponse enrichWithPosition(Ticket ticket) {
        Integer position = ticket.getPosition();
        Integer estimated = null;

        if (position == null && ticket.getStatus() == TicketStatus.WAITING) {
            List<Ticket> waiting = ticketRepository.findWaitingByQueueId(ticket.getQueue().getId());
            for (int indexValue8 = 0; indexValue8 < waiting.size(); indexValue8++) {
                if (waiting.get(indexValue8).getId().equals(ticket.getId())) {
                    position = indexValue8 + 1;
                    break;
                }
            }
        } else if (position == null && ticket.getStatus() == TicketStatus.WAITLISTED) {
            List<Ticket> waitlisted = ticketRepository.findWaitlistedByQueueId(ticket.getQueue().getId());
            for (int indexValue9 = 0; indexValue9 < waitlisted.size(); indexValue9++) {
                if (waitlisted.get(indexValue9).getId().equals(ticket.getId())) {
                    position = indexValue9 + 1;
                    break;
                }
            }
        }

        int per = ticket.getQueue().getAverageServiceMinutes() != null
                ? ticket.getQueue().getAverageServiceMinutes() : 5;

        if (ticket.getStatus() == TicketStatus.WAITING && position != null) {
            estimated = position * per;
        } else if (ticket.getStatus() == TicketStatus.WAITLISTED && position != null) {
            int ahead = ticketRepository.findWaitingByQueueId(ticket.getQueue().getId()).size()
                    + (position - 1);
            estimated = ahead * per;
        }

        return TicketResponse.from(ticket, position, estimated);
    }
}