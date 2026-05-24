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
public class SetSettingsRequest extends Request {

    private boolean settingUnlockOnUnequip;
    private boolean settingRageSet;
    private boolean settingPenSet;
    private boolean settingGpu;
    private Integer settingMaxResults;
    private Integer settingPenDefense;
}
