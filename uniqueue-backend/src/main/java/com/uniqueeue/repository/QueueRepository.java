package com.uniqueeue.repository;

import com.uniqueeue.model.Queue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueRepository extends JpaRepository<Queue, Long> {
    List<Queue> findByUniversityId(Long universityId);
    List<Queue> findByUniversityIdAndIsActiveTrue(Long universityId);
    Optional<Queue> findByIdAndUniversityId(Long id, Long universityId);
    long countByUniversityId(Long universityId);
    List<Queue> findByOfficeId(Long officeId);
    List<Queue> findByOfficeIsNull();
    List<Queue> findByUniversityIdOrderByNameAsc(Long universityId);
    List<Queue> findByOfficeIsNullAndDepartmentIsNotNull();

    long countByOfficeId(Long officeId);

    @org.springframework.data.jpa.repository.Query(
            "SELECT COUNT(DISTINCT qs.user.id) FROM QueueStaff qs " +
                    "WHERE qs.queue.id IN (SELECT q.id FROM Queue q WHERE q.office.id = :officeId)"
    )
    long countDistinctStaffByOfficeId(
            @org.springframework.data.repository.query.Param("officeId") Long officeId);

    @org.springframework.data.jpa.repository.Query(
            "SELECT COUNT(t) FROM Ticket t " +
                    "WHERE t.status = com.uniqueeue.enums.TicketStatus.WAITING " +
                    "AND t.queue.id IN (SELECT q.id FROM Queue q WHERE q.office.id = :officeId)"
    )
    long countWaitingByOfficeId(
            @org.springframework.data.repository.query.Param("officeId") Long officeId);
}