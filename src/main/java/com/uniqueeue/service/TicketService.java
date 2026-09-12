package com.uniqueeue.service;

import com.uniqueeue.dto.response.TicketResponse;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
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

        return enrichWithPosition(ticket);
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
        if (ticket.getStatus() == TicketStatus.WAITING) {
            List<Ticket> waiting = ticketRepository.findWaitingByQueueId(ticket.getQueue().getId());
            for (int i = 0; i < waiting.size(); i++) {
                if (waiting.get(i).getId().equals(ticket.getId())) {
                    position = i + 1;
                    break;
                }
            }
        }
        return TicketResponse.from(ticket, position);
    }
}

