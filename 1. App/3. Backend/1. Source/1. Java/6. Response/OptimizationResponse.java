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
    // True when the run used keep-best-N mode (scanned everything, kept the best N)
    // —
    // so the frontend shows "best N" messaging instead of "result limit exceeded".
    @Builder.Default
    private boolean keptBestN = false;
}
