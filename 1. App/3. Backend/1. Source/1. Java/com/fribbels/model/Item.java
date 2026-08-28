package com.fribbels.model;

import com.fribbels.enums.Gear;
import com.fribbels.enums.Material;
import com.fribbels.enums.Rank;
import com.fribbels.enums.Set;
import com.google.gson.Gson;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.With;

import java.util.List;

@Builder
@Getter
@Setter
@With
@AllArgsConstructor
@EqualsAndHashCode
public class Item {

    private static final Gson GSON = new Gson();

    private Gear gear;
    private Rank rank;
    public Set set;

    private Integer enhance;
    public Integer level;

    private Stat main;
    private List<Stat> substats;
    private List<List<String>> op;
    private Boolean storage;
    private Mod mod;

    private String name;

    private AugmentedStats augmentedStats;
    private AugmentedStats reforgedStats;
    private Material material;
    private String mconfidence;

    public String id;
    public String modId;
    public String ingameId;
    public String ingameEquippedId;

    private String equippedById;
    private String equippedByName;
    private String heroName;

    private boolean locked;
    private boolean disableMods;
    public int reforgeable;
    public int upgradeable;
    public int convertable;
    public int alreadyEquipped;
    public int priority;
    // Higher-precision per-item weighted score (×100 of priorityFilter.calculateScore's
    // float `score`).  Summed by the optimizer into the build-level `buildScore`, which is
    // the faithful per-slot/per-set-weighted ranking basis; `priority` (rounded) stays the
    // legacy `prio` column + min/max-priority filter unit.
    public int priorityScore;
    private int wss;
    private int reforgedWss;
    private int dpsWss;
    private int supportWss;
    private int combatWss;

    private String duplicateId;
    private String allowedMods;

    private Boolean otherworldly;

    public transient float[] tempStatAccArr;

    public String toString() {
        return GSON.toJson(this);
    }

    public int getHash() {
        final HashItem hashItem = new HashItem(gear, rank, set, level, main, augmentedStats);
        return hashItem.hashCode();
    }
}
