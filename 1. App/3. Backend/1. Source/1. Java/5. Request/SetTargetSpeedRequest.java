package com.fribbels.request;

import com.fribbels.model.Request;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Lightweight request to set just a hero's manual {@code targetSpeed} (the
 * Hero-grid
 * roster speed-ranking value), so inline grid edits don't have to round-trip
 * the whole
 * Bonus Stats form.
 */
@Getter
@Setter
@ToString
public class SetTargetSpeedRequest extends Request {
    private String heroId;
    private int targetSpeed;
}
