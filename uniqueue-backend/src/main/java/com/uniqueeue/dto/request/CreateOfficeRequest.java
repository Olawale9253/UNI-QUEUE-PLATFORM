package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateOfficeRequest {

    @NotBlank(message = "Office name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String location;

    @Size(max = 50)
    private String icon;

    private LocalTime openingTime;
    private LocalTime closingTime;

    @Min(value = 1, message = "Slot duration must be at least 1 minute")
    private Integer slotDurationMinutes;

    private Boolean isActive;
}