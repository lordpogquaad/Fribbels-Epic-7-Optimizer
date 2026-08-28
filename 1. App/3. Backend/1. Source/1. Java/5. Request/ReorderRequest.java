package com.fribbels.request;

import com.fribbels.model.Request;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@ToString
@NoArgsConstructor
public class ReorderRequest extends Request {

    private String id;
    private String destinationId;
    private Integer destinationIndex;
}
