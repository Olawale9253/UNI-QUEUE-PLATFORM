package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUniversityRequest {


    @Size(max = 500)
    private String campusImageUrl;

    @Size(max = 255)
    private String tagline;

    @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String emailDomain;

    private String matricPattern;
    private String matricExample;
    private String matricDescription;
    @Size(max = 500)
    private String logoUrl;
    private String primaryColor;
    private String plan;
    private Integer maxStaff;
    private Integer maxQueues;
    private Boolean isActive;
}