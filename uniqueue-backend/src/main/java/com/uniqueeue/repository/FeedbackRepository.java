package com.uniqueeue.repository;

import com.uniqueeue.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    boolean existsByTicketId(Long ticketId);

    List<Feedback> findByTicketId(Long ticketId);

    // All feedback for tickets served by a specific staff member
    @Query("SELECT f FROM Feedback f WHERE f.ticket.servedBy.id = :staffId")
    List<Feedback> findByServedById(@Param("staffId") Long staffId);

    // All feedback across a university's queues
    @Query("SELECT f FROM Feedback f WHERE f.ticket.queue.university.id = :universityId ORDER BY f.createdAt DESC")
    List<Feedback> findByUniversityId(@Param("universityId") Long universityId);

    // Average rating per queue
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.ticket.queue.id = :queueId")
    Double avgRatingByQueueId(@Param("queueId") Long queueId);

    // Average rating per staff
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.ticket.servedBy.id = :staffId")
    Double avgRatingByStaffId(@Param("staffId") Long staffId);

    // Average rating across university
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.ticket.queue.university.id = :universityId")
    Double avgRatingByUniversityId(@Param("universityId") Long universityId);
}