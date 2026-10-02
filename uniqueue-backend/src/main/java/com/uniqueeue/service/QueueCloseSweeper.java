package com.uniqueeue.service;

import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Runs every 5 minutes. For every active queue that is currently CLOSED,
 * cancels any tickets still in WAITING or WAITLISTED status.
 *
 * CALLED tickets are deliberately NOT swept — staff must be able to finish
 * serving a student who was called just before close. Stale CALLED tickets
 * no longer block the next day because TicketService.callNext() only blocks
 * on tickets called today.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class QueueCloseSweeper {

    private final QueueRepository queueRepository;
    private final TicketRepository ticketRepository;
    private final QueueScheduleService scheduleService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Scheduled(cron = "0 */5 * * * *")   // every 5 minutes
    @Transactional
    public void sweepClosedQueues() {
        List<Queue> queues = queueRepository.findAll();

        for (Queue queue : queues) {
            if (!Boolean.TRUE.equals(queue.getIsActive())) continue;
            if (queue.getOpensAt() == null || queue.getClosesAt() == null) continue;
            if (scheduleService.isWithinOperatingHours(queue)) continue;

            List<Ticket> stale = new ArrayList<>();
            stale.addAll(ticketRepository.findWaitingByQueueId(queue.getId()));
            stale.addAll(ticketRepository.findWaitlistedByQueueId(queue.getId()));
            // NOTE: CALLED tickets are intentionally NOT swept.

            if (stale.isEmpty()) continue;

            for (Ticket t : stale) {
                t.setStatus(TicketStatus.CANCELLED);
                t.setNotes(appendNote(t.getNotes(), "Auto-cancelled at queue close"));
                ticketRepository.save(t);

                notificationService.notify(t.getUser(), NotificationType.SYSTEM,
                        "Queue closed for the day",
                        "Ticket " + t.getTicketNumber() + " was cancelled because "
                                + queue.getName() + " closed. You can rejoin when it reopens.");
            }

            log.info("Sweeper cancelled {} stale tickets for queue '{}' (id={})",
                    stale.size(), queue.getName(), queue.getId());

            auditService.record(null, queue.getUniversity().getId(),
                    AuditAction.TICKET_CANCELLED, "Queue", queue.getId(),
                    "{\"reason\":\"auto-close\",\"count\":" + stale.size() + "}");
        }
    }

    private String appendNote(String current, String note) {
        if (current == null || current.isBlank()) return note;
        return current + " | " + note;
    }
}