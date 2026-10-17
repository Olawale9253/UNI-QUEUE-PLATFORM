package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "platform_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlatformSetting {

    @Id
    private Long id = 1L; // We only ever have one row

    @Column(name = "ngn_exchange_rate", nullable = false)
    @Builder.Default
    private Double ngnExchangeRate = 1500.0;

    // Add other global settings here later (e.g., maintenance mode)
}