package com.uniqueeue.repository;

import com.uniqueeue.model.QueueStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueStaffRepository extends JpaRepository<QueueStaff, Long> {
    List<QueueStaff> findByQueueId(Long queueId);
    List<QueueStaff> findByUserId(Long userId);
    Optional<QueueStaff> findByQueueIdAndUserId(Long queueId, Long userId);
    boolean existsByQueueIdAndUserId(Long queueId, Long userId);
    void deleteByQueueIdAndUserId(Long queueId, Long userId);
    long countByQueueId(Long queueId);
}