package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "greeting_campaigns")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GreetingCampaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // e.g., "Happy Independence Day!"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message; // The body text

    private String imageUrl; // A festive banner image (optional)

    @Column(nullable = false)
    private LocalDate scheduledDate; // The exact date to send it

    // 👇 RENAMED FROM isSent TO sent
    @Column(nullable = false)
    private boolean sent = false;
}