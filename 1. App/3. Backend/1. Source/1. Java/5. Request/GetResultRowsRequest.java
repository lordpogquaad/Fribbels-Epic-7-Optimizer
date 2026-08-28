package com.fribbels.request;

import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.Request;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@Builder
@ToString
public class GetResultRowsRequest extends Request {

    private String executionId;
    private int startRow;
    private int endRow;
    private OptimizationColumn sortColumn;
    private SortOrder sortOrder;
    // Effectiveness weight for the SpdEff synthetic sort key (spd + eff*weight).
    // Sent by the frontend so the server-side sort matches the displayed column.
    private double spdEffWeight;
    private OptimizationRequest optimizationRequest;
}
