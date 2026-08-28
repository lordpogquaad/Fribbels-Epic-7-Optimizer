package com.fribbels.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SkillData {

    public String name;
    @Builder.Default
    public Float rate = 0f;
    @Builder.Default
    public Float pow = 0f;
    @Builder.Default
    public Integer targets = 0;
    @Builder.Default
    public Float selfHpScaling = 0f;
    @Builder.Default
    public Float selfAtkScaling = 0f;
    @Builder.Default
    public Float selfDefScaling = 0f;
    @Builder.Default
    public Float selfSpdScaling = 0f;
    @Builder.Default
    public Float increasedValue = 0f;
    @Builder.Default
    public Float extraSelfHpScaling = 0f;
    @Builder.Default
    public Float extraSelfDefScaling = 0f;
    @Builder.Default
    public Float extraSelfAtkScaling = 0f;
    @Builder.Default
    public Float cdmgIncrease = 0f;
    @Builder.Default
    public Float penetration = 0f;
}
