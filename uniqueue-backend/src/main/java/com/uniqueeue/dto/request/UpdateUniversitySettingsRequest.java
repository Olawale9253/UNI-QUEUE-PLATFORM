package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUniversitySettingsRequest {

    @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String emailDomain;

    private String matricPattern;

    @Size(max = 100)
    private String matricExample;

    private String matricDescription;

    @Size(max = 500)
    private String logoUrl;

    @Size(max = 20)
    private String primaryColor;

    @Min(value = 1, message = "Max staff must be at least 1")
    private Integer maxStaff;

    @Min(value = 1, message = "Max queues must be at least 1")
    private Integer maxQueues;
}