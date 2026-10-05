package com.uniqueeue.repository;

import com.uniqueeue.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByUserId(Long userId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    long countByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.endpoint = :endpoint")
    int deleteByEndpoint(@Param("endpoint") String endpoint);

    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.userId = :userId")
    int deleteByUserId(@Param("userId") Long userId);
}