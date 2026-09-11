package com.uniqueeue.repository;

import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Active ticket for a user (WAITING / CALLED / SERVING)
    @Query("SELECT t FROM Ticket t WHERE t.user.id = :userId " +
            "AND t.status IN (com.uniqueeue.enums.TicketStatus.WAITING, " +
            "                 com.uniqueeue.enums.TicketStatus.CALLED, " +
            "                 com.uniqueeue.enums.TicketStatus.SERVING)")
    List<Ticket> findActiveByUserId(@Param("userId") Long userId);

    // Full history for a user
    List<Ticket> findByUserIdOrderByJoinedAtDesc(Long userId);

    // All tickets in a queue, oldest first
    List<Ticket> findByQueueIdOrderByJoinedAtAsc(Long queueId);

    // Waiting tickets, ordered by priority then join time
    @Query("SELECT t FROM Ticket t WHERE t.queue.id = :queueId " +
            "AND t.status = com.uniqueeue.enums.TicketStatus.WAITING " +
            "ORDER BY t.priority DESC, t.joinedAt ASC")
    List<Ticket> findWaitingByQueueId(@Param("queueId") Long queueId);

    // Tickets joined today in a queue (for ticket_number generation)
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.queue.id = :queueId AND t.joinedAt >= :startOfDay")
    long countTodayByQueueId(@Param("queueId") Long queueId,
                             @Param("startOfDay") LocalDateTime startOfDay);

    // Called ticket in a queue (there should be at most one)
    @Query("SELECT t FROM Ticket t WHERE t.queue.id = :queueId " +
            "AND t.status = com.uniqueeue.enums.TicketStatus.CALLED " +
            "ORDER BY t.calledAt DESC")
    List<Ticket> findCalledByQueueId(@Param("queueId") Long queueId);

    Optional<Ticket> findByIdAndQueueId(Long id, Long queueId);
}