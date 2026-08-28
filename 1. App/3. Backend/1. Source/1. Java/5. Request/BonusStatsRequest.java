package com.fribbels.request;

import com.fribbels.model.Request;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@Builder
@ToString
public class BonusStatsRequest extends Request {

    private int atk;
    private int def;
    private int hp;
    private float atkPercent;
    private float defPercent;
    private float hpPercent;
    private int speed;
    private float cr;
    private float cd;
    private float eff;
    private float res;
    private float crPush;
    // Manual per-hero target speed for ranking the roster (fastest-first) in the
    // Hero
    // grid. Purely a planning number the user types — never calculated.
    private int targetSpeed;
    // Build Planner fields — manual planning data, never calculated.
    private boolean lowPickRate;
    private int usageRate;
    private java.util.List<String> targetSets;

    private float aeiAtk;
    private float aeiDef;
    private float aeiHp;
    private float aeiAtkPercent;
    private float aeiDefPercent;
    private float aeiHpPercent;
    private int aeiSpeed;
    private float aeiCr;
    private float aeiCd;
    private float aeiEff;
    private float aeiRes;

    private float finalAtkMultiplier;
    private float finalDefMultiplier;
    private float finalHpMultiplier;

    private int cdCapBonus;

    private float artifactAttack;
    private float artifactHealth;
    private float artifactDefense;

    private String artifactName;
    private String artifactLevel;
    private String imprintNumber;
    private String eeNumber;
    private String heroId;

    private int stars;
}
