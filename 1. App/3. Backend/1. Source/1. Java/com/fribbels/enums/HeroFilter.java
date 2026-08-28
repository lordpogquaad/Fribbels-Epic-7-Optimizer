package com.fribbels.enums;

import com.google.gson.annotations.SerializedName;

public enum HeroFilter {

    @SerializedName("optimizer")
    OPTIMIZER,
    @SerializedName("sixstar")
    SIX_STAR,
    @SerializedName("fivestar")
    FIVE_STAR,
}
