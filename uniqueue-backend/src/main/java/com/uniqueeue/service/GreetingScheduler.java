package com.uniqueeue.service;

import com.uniqueeue.model.GreetingCampaign;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.GreetingCampaignRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class GreetingScheduler {

    private final GreetingCampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Runs every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyGreetings() {
        LocalDate today = LocalDate.now();
        List<GreetingCampaign> campaigns = campaignRepository.findByScheduledDateAndIsSentFalse(today);

        if (campaigns.isEmpty()) {
            return;
        }

        log.info("Found {} greeting campaigns to send today.", campaigns.size());
        List<User> activeUsers = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .toList();

        for (GreetingCampaign campaign : campaigns) {
            for (User user : activeUsers) {
                emailService.sendGreetingEmail(user, campaign.getTitle(), campaign.getMessage(), campaign.getImageUrl());
            }

            // Mark as sent so it doesn't send again today
            campaign.setSent(true);
            campaignRepository.save(campaign);
            log.info("Greeting campaign '{}' sent successfully.", campaign.getTitle());
        }
    }
}