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
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.QueueStaffRepository;
import com.uniqueeue.repository.TicketRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final QueueRepository queueRepository;
    private final UserRepository userRepository;
    private final QueueStaffRepository queueStaffRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    // ---------- STUDENT ----------

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
        if (!isWithinOperatingHours(queue)) {
            throw new BadRequestException(
                    "Queue is closed. Opens at " + queue.getOpensAt() + ", closes at " + queue.getClosesAt() + ".");
        }

        List<Ticket> active = ticketRepository.findActiveByUserId(userId);
        if (!active.isEmpty()) {
            throw new BadRequestException("You already have an active ticket");
        }

        long waiting = ticketRepository.findWaitingByQueueId(queueId).size();
        if (waiting >= queue.getMaxCapacity()) {
            throw new BadRequestException("Queue is full");
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long todayCount = ticketRepository.countTodayByQueueId(queueId, startOfDay);
        String prefix = String.valueOf(queue.getName().charAt(0)).toUpperCase();
        String ticketNumber = String.format("%s-%03d", prefix, todayCount + 1);

        Ticket ticket = Ticket.builder()
                .queue(queue)
                .user(user)
                .ticketNumber(ticketNumber)
                .status(TicketStatus.WAITING)
                .priority(0)
                .build();
        ticket = ticketRepository.save(ticket);

        recalculatePositions(queueId);

        Ticket fresh = ticketRepository.findById(ticket.getId()).orElseThrow();
        int pos = fresh.getPosition() != null ? fresh.getPosition() : 1;
        notificationService.notify(user, NotificationType.QUEUE_UPDATE,
                "You've joined " + queue.getName(),
                "Ticket " + ticketNumber + " · Position " + pos + ". We'll notify you when it's your turn.");

        auditService.record(userId, queue.getUniversity().getId(),
                AuditAction.TICKET_JOINED, "Ticket", ticket.getId(),
                "{\"ticketNumber\":\"" + ticketNumber + "\",\"queueId\":" + queueId + "}");

        return enrichWithPosition(fresh);
    }

    @Transactional(readOnly = true)
    public Optional<TicketResponse> getActiveTicket(Long userId) {
        List<Ticket> active = ticketRepository.findActiveByUserId(userId);
        if (active.isEmpty()) return Optional.empty();
        return Optional.of(enrichWithPosition(active.get(0)));
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
            throw new BadRequestException("Not your ticket");
        }
        if (ticket.getStatus() != TicketStatus.WAITING
                && ticket.getStatus() != TicketStatus.CALLED) {
            throw new BadRequestException("Cannot leave a ticket that is " + ticket.getStatus());
        }
        ticket.setStatus(TicketStatus.CANCELLED);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        auditService.record(userId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_CANCELLED, "Ticket", ticketId, null);
    }

    // ---------- STAFF ----------

    @Transactional(readOnly = true)
    public List<com.uniqueeue.dto.response.QueueResponse> listMyQueues(Long staffUserId) {
        List<com.uniqueeue.model.QueueStaff> assignments = queueStaffRepository.findByUserId(staffUserId);
        return assignments.stream()
                .map(a -> com.uniqueeue.dto.response.QueueResponse.from(a.getQueue()))
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
        if (!called.isEmpty()) {
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
        ticketRepository.save(next);

        recalculatePositions(queueId);

        notificationService.notify(next.getUser(), NotificationType.TICKET_CALLED,
                "It's your turn!",
                "Ticket " + next.getTicketNumber() + " is now being called at " + next.getQueue().getName() + ".");

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
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        notificationService.notify(ticket.getUser(), NotificationType.TICKET_CALLED,
                "It's your turn!",
                "Ticket " + ticket.getTicketNumber() + " is now being called.");

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

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_SERVED, "Ticket", ticketId, null);

        return enrichWithPosition(ticket);
    }

    @Transactional
    public TicketResponse completeTicket(Long staffUserId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.SERVING
                && ticket.getStatus() != TicketStatus.CALLED) {
            throw new BadRequestException("Only SERVING or CALLED tickets can be completed");
        }
        ticket.setStatus(TicketStatus.COMPLETED);
        ticket.setCompletedAt(LocalDateTime.now());
        if (ticket.getServedBy() == null) {
            ticket.setServedBy(userRepository.findById(staffUserId).orElseThrow());
        }
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        notificationService.notify(ticket.getUser(), NotificationType.TICKET_SERVED,
                "Service complete",
                "Thanks for using UniQueue. Please rate your experience.");

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
        ticket.setStatus(TicketStatus.NO_SHOW);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        notificationService.notify(ticket.getUser(), NotificationType.SYSTEM,
                "You missed your turn",
                "Ticket " + ticket.getTicketNumber() + " was marked as a no-show.");

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
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        notificationService.notify(ticket.getUser(), NotificationType.SYSTEM,
                "Ticket transferred",
                "Your ticket " + ticket.getTicketNumber() + " has been transferred to another desk.");

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_TRANSFERRED, "Ticket", ticketId, null);

        return enrichWithPosition(ticket);
    }

    // ---------- PRIORITY ----------

    @Transactional
    public TicketResponse setPriority(Long staffUserId, Long ticketId, int priority) {
        if (priority < 0 || priority > 100) {
            throw new BadRequestException("Priority must be between 0 and 100");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ensureStaffOwnsQueue(staffUserId, ticket.getQueue().getId());

        if (ticket.getStatus() != TicketStatus.WAITING) {
            throw new BadRequestException("Only WAITING tickets can have their priority changed");
        }

        ticket.setPriority(priority);
        ticketRepository.save(ticket);
        recalculatePositions(ticket.getQueue().getId());

        auditService.record(staffUserId, ticket.getQueue().getUniversity().getId(),
                AuditAction.TICKET_PRIORITY_CHANGED, "Ticket", ticketId,
                "{\"priority\":" + priority + "}");

        return enrichWithPosition(ticket);
    }

    // ---------- ESTIMATE ----------

    @Transactional(readOnly = true)
    public QueueEstimateResponse estimate(Long queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));

        List<Ticket> waiting = ticketRepository.findWaitingByQueueId(queueId);
        List<Ticket> called = ticketRepository.findCalledByQueueId(queueId);

        // actual avg for today from completed tickets
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<Ticket> todayDone = ticketRepository.findRecentByQueue(queueId, startOfDay).stream()
                .filter(t -> t.getStatus() == TicketStatus.COMPLETED)
                .filter(t -> t.getJoinedAt() != null && t.getCalledAt() != null)
                .toList();

        double actualAvg = todayDone.isEmpty() ? 0
                : todayDone.stream()
                .mapToLong(t -> Duration.between(t.getJoinedAt(), t.getCalledAt()).toMinutes())
                .average().orElse(0);

        int perTicketMinutes = queue.getAverageServiceMinutes() != null
                ? queue.getAverageServiceMinutes() : 5;

        // Estimate for a brand new joiner = waitingCount * perTicket
        int estimateForNewJoiner = Math.max(0, waiting.size() * perTicketMinutes);

        String currentlyServing = called.isEmpty() ? null : called.get(0).getTicketNumber();

        return QueueEstimateResponse.builder()
                .queueId(queue.getId())
                .queueName(queue.getName())
                .isOpen(isWithinOperatingHours(queue))
                .opensAt(queue.getOpensAt() != null ? queue.getOpensAt().toString() : null)
                .closesAt(queue.getClosesAt() != null ? queue.getClosesAt().toString() : null)
                .waitingCount(waiting.size())
                .activeCalledCount(called.size())
                .currentlyServing(currentlyServing)
                .configuredAvgMinutes(perTicketMinutes)
                .actualAvgMinutesToday(Math.round(actualAvg * 10.0) / 10.0)
                .estimatedMinutesForNewJoiner(estimateForNewJoiner)
                .build();
    }

    // ---------- HELPERS ----------

    private void ensureStaffOwnsQueue(Long staffUserId, Long queueId) {
        if (!queueStaffRepository.existsByQueueIdAndUserId(queueId, staffUserId)) {
            throw new BadRequestException("You are not assigned to this queue");
        }
    }

    private void recalculatePositions(Long queueId) {
        List<Ticket> waiting = ticketRepository.findWaitingByQueueId(queueId);
        int pos = 1;
        for (Ticket t : waiting) {
            t.setPosition(pos++);
        }
        ticketRepository.saveAll(waiting);
    }

    private TicketResponse enrichWithPosition(Ticket ticket) {
        Integer position = ticket.getPosition();
        Integer estimated = null;

        if (ticket.getStatus() == TicketStatus.WAITING) {
            List<Ticket> waiting = ticketRepository.findWaitingByQueueId(ticket.getQueue().getId());
            for (int i = 0; i < waiting.size(); i++) {
                if (waiting.get(i).getId().equals(ticket.getId())) {
                    position = i + 1;
                    break;
                }
            }
            int perTicket = ticket.getQueue().getAverageServiceMinutes() != null
                    ? ticket.getQueue().getAverageServiceMinutes() : 5;
            estimated = position != null ? position * perTicket : null;
        }

        return TicketResponse.from(ticket, position, estimated);
    }

    /** Returns true if current time is within [opensAt, closesAt]. Handles overnight windows. */
    private boolean isWithinOperatingHours(Queue queue) {
        if (queue.getOpensAt() == null || queue.getClosesAt() == null) return true;

        LocalTime now = LocalTime.now();
        LocalTime open = queue.getOpensAt();
        LocalTime close = queue.getClosesAt();

        if (open.equals(close)) return true;  // 24h
        if (open.isBefore(close)) {
            // same-day window, e.g. 08:00 – 17:00
            return !now.isBefore(open) && !now.isAfter(close);
        } else {
            // overnight, e.g. 22:00 – 02:00
            return !now.isBefore(open) || !now.isAfter(close);
        }
    }
}