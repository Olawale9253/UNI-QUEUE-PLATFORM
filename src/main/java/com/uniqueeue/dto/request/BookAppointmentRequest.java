package com.uniqueeue.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookAppointmentRequest {

    @NotNull(message = "Slot ID is required")
    private Long slotId;

    @Size(max = 2000)
    private String notes;
}