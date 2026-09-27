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

    // ---------- existing queries ----------

    /** Active = WAITING, WAITLISTED, CALLED, SERVING. */
    @Query("SELECT t FROM Ticket t WHERE t.user.id = :userId " +
            "AND t.status IN (com.uniqueeue.enums.TicketStatus.WAITING, " +
            "                 com.uniqueeue.enums.TicketStatus.WAITLISTED, " +
            "                 com.uniqueeue.enums.TicketStatus.CALLED, " +
            "                 com.uniqueeue.enums.TicketStatus.SERVING)")
    List<Ticket> findActiveByUserId(@Param("userId") Long userId);

    java.util.List<com.uniqueeue.model.Ticket> findByUserIdOrderByJoinedAtDesc(Long userId);

    @org.springframework.data.jpa.repository.Query(
            "SELECT t FROM Ticket t WHERE t.servedBy.id = :staffId"
    )
    java.util.List<com.uniqueeue.model.Ticket> findByServedById(
            @org.springframework.data.repository.query.Param("staffId") Long staffId);

    List<Ticket> findByQueueId(Long queueId);

    List<Ticket> findByQueueIdOrderByJoinedAtAsc(Long queueId);

    @Query("SELECT t FROM Ticket t WHERE t.queue.id = :queueId " +
            "AND t.status = com.uniqueeue.enums.TicketStatus.WAITING " +
            "ORDER BY t.priority DESC, t.joinedAt ASC")
    List<Ticket> findWaitingByQueueId(@Param("queueId") Long queueId);

    /** NEW — waitlisted tickets, priority first, then FIFO. */
    @Query("SELECT t FROM Ticket t WHERE t.queue.id = :queueId " +
            "AND t.status = com.uniqueeue.enums.TicketStatus.WAITLISTED " +
            "ORDER BY t.priority DESC, t.joinedAt ASC")
    List<Ticket> findWaitlistedByQueueId(@Param("queueId") Long queueId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.queue.id = :queueId AND t.joinedAt >= :startOfDay")
    long countTodayByQueueId(@Param("queueId") Long queueId,
                             @Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT t FROM Ticket t WHERE t.queue.id = :queueId " +
            "AND t.status = com.uniqueeue.enums.TicketStatus.CALLED " +
            "ORDER BY t.calledAt DESC")
    List<Ticket> findCalledByQueueId(@Param("queueId") Long queueId);

    boolean existsByTicketNumber(String ticketNumber);

    Optional<Ticket> findByIdAndQueueId(Long id, Long queueId);

    // ---------- analytics queries ----------

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.queue.university.id = :universityId AND t.joinedAt >= :since")
    long countByUniversitySince(@Param("universityId") Long universityId,
                                @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.queue.university.id = :universityId")
    long countByUniversity(@Param("universityId") Long universityId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.queue.id = :queueId AND t.status = :status")
    long countByQueueAndStatus(@Param("queueId") Long queueId,
                               @Param("status") TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.queue.university.id = :universityId AND t.status = :status")
    long countByUniversityAndStatus(@Param("universityId") Long universityId,
                                    @Param("status") TicketStatus status);

    @Query("SELECT t FROM Ticket t WHERE t.queue.university.id = :universityId AND t.joinedAt >= :since")
    List<Ticket> findRecentByUniversity(@Param("universityId") Long universityId,
                                        @Param("since") LocalDateTime since);

    @Query("SELECT t FROM Ticket t WHERE t.queue.id = :queueId AND t.joinedAt >= :since")
    List<Ticket> findRecentByQueue(@Param("queueId") Long queueId,
                                   @Param("since") LocalDateTime since);

    @Query("SELECT t FROM Ticket t WHERE t.servedBy.id = :staffId AND t.joinedAt >= :since")
    List<Ticket> findRecentByStaff(@Param("staffId") Long staffId,
                                   @Param("since") LocalDateTime since);
}