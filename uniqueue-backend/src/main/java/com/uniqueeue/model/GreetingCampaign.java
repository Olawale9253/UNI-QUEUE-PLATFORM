package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "greeting_campaigns")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GreetingCampaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    private String imageUrl;

    @Column(nullable = false)
    private LocalDate scheduledDate;

    // 👇 RENAMED THIS FROM isSent TO sent
    @Column(nullable = false)
    private boolean sent = false;
}