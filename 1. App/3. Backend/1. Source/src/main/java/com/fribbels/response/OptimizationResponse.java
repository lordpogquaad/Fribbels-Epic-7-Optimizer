package com.fribbels.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
@AllArgsConstructor
public class OptimizationResponse extends Response {

    private long searched;
    private long results;
    @Builder.Default
    private boolean done = false;
}
