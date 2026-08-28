package com.fribbels.request;

import com.fribbels.model.Request;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Lightweight partial-update for the Hero-grid inline Build Planner cells (Low
 * Pick
 * checkbox, Usage % cell) so each edit doesn't round-trip the whole Bonus Stats
 * form.
 * Boxed fields are null when not supplied; the handler applies only the
 * non-null ones.
 */
@Getter
@Setter
@ToString
public class SetBuildPlannerRequest extends Request {
    private String heroId;
    private Boolean lowPickRate;
    private Integer usageRate;
    private Integer targetSpeed;
}
