package com.fribbels.model;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
public class BaseStats {

    private HeroStats lv50FiveStarFullyAwakened;
    private HeroStats lv60SixStarFullyAwakened;
    private HeroSkills skills;
}
