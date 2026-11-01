package com.uniqueeue.repository;

import com.uniqueeue.model.GreetingCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GreetingCampaignRepository extends JpaRepository<GreetingCampaign, Long> {
    List<GreetingCampaign> findByScheduledDateAndSentFalse(LocalDate date);
}