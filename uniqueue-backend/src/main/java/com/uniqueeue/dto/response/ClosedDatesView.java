package com.uniqueeue.dto.response;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClosedDatesView {

    private boolean todayClosed;
    private String todayReason;
    private List<ClosedDateResponse> upcoming;
}