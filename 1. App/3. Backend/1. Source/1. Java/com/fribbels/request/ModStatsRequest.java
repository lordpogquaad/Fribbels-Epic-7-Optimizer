package com.fribbels.request;

import com.fribbels.enums.StatType;
import com.fribbels.model.Request;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Map;

@Setter
@Getter
@Builder
@ToString
public class ModStatsRequest extends Request {

    private String modGrade;
    private String keepStatOptions;
    private Float rollQuality;
    private Integer limitRolls;
    private Integer maxModPieces;
    private List<StatType> keepStats;
    private List<StatType> ignoreStats;
    private List<StatType> discardStats;
    private List<String> modSlots;
    private Map<String, Object> slotModConfig;
    private String heroId;
}
