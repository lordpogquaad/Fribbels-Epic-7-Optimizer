package com.fribbels.db;

import com.fribbels.model.DamageMultipliers;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroSkillOptions;
import com.fribbels.model.SingleSkillOptions;
import com.fribbels.request.OptimizationRequest;
import com.fribbels.request.SkillOptionsRequest;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * The renderer saves a hero's search settings through
 * {@link HeroDb#saveOptimizationRequest}, which round-trips the request through Gson, and
 * the multi-hero tab then filters gear with {@code hero.optimizationRequest} as its params.
 * A setting {@link OptimizationRequest} does not declare is dropped there with no notice.
 */
public class HeroDbTest {

    private static final Gson GSON = new Gson();

    /** Request keys the renderer sends for the settings that used to be dropped, with realistic values. */
    private static final String RENDERER_JSON = """
            {
              "hero": {"id": "h1", "name": "Nobody"},
              "executionId": "run-1",
              "inputSpdMinLimit": 200,
              "inputSetsOne": ["SpeedSet"],
              "inputGlobalMustHaveStat": "Speed",
              "inputGlobalMustHaveCount": 2,
              "inputPriorityScoreFloor": 150,
              "inputSlotSubstatFilters": {"Weapon": [{"type": "Speed", "count": 2}]},
              "inputSlotStatFloors": {"Ring": {"enabled": true, "floors": {"Speed": 10}}},
              "inputMinItemGSLimit": 60,
              "inputMaxItemGSLimit": 90,
              "inputWeaponFilterPriority": 5,
              "inputHelmetFilterPriority": 6,
              "inputArmorFilterPriority": 7,
              "inputNecklaceFilterPriority": 8,
              "inputRingFilterPriority": 9,
              "inputBootsFilterPriority": 10,
              "inputForceAndMode": true,
              "enhanceLimit": ["12"]
            }
            """;

    private static HeroDb heroDbWith(final String heroId) {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        heroDb.addHeroes(List.of(Hero.builder().id(heroId).name("Nobody").build()));
        return heroDb;
    }

    private static JsonObject savedJson(final HeroDb heroDb, final String heroId) {
        final OptimizationRequest saved = heroDb.getHeroById(heroId).getOptimizationRequest();
        assertNotNull(saved, "no request was saved on the hero");
        return GSON.toJsonTree(saved).getAsJsonObject();
    }

    @Test
    void everySearchSettingTheRendererSavesSurvivesTheSaveAndReload() {
        final HeroDb heroDb = heroDbWith("h1");
        heroDb.saveOptimizationRequest(GSON.fromJson(RENDERER_JSON, OptimizationRequest.class));

        final JsonObject saved = savedJson(heroDb, "h1");
        final JsonObject sent = JsonParser.parseString(RENDERER_JSON).getAsJsonObject();
        for (final Map.Entry<String, JsonElement> entry : sent.entrySet()) {
            final String key = entry.getKey();
            if ("hero".equals(key) || "executionId".equals(key)) {
                continue; // stripped or per-run, not a saved setting
            }
            assertEquals(entry.getValue(), saved.get(key), key + " did not survive the save");
        }
    }

    @Test
    void anUnsetGsLimitStaysUnsetInsteadOfBecomingZero() {
        final HeroDb heroDb = heroDbWith("h1");
        heroDb.saveOptimizationRequest(GSON.fromJson(
                "{\"hero\":{\"id\":\"h1\"},\"inputMinItemGSLimit\":60}", OptimizationRequest.class));

        // The renderer filter treats null as "no limit"; 0 as a max would reject every item.
        final JsonObject saved = savedJson(heroDb, "h1");
        assertEquals(60, saved.get("inputMinItemGSLimit").getAsInt());
        assertFalse(saved.has("inputMaxItemGSLimit"), "an unset max GS limit was saved as a value");
    }

    @Test
    void theSavedCopyDropsTheHeavyFieldsAndTheLiveHero() {
        final HeroDb heroDb = heroDbWith("h1");
        heroDb.saveOptimizationRequest(GSON.fromJson(RENDERER_JSON, OptimizationRequest.class));

        final OptimizationRequest saved = heroDb.getHeroById("h1").getOptimizationRequest();
        assertNull(saved.getHero());
        assertNull(saved.getItems());
        assertNull(saved.getBoolArr());
    }

    @Test
    void theSavedCopyCarriesNoDamageMultipliers() {
        // They are derived from the hero's skills and options on every run, and a copy saved
        // here is what a multi-hero run merges in: it would serve old values (B18).
        final HeroDb heroDb = heroDbWith("h1");
        final OptimizationRequest request = GSON.fromJson(RENDERER_JSON, OptimizationRequest.class);
        request.setDamageMultipliers(DamageMultipliers.builder().build());
        heroDb.saveOptimizationRequest(request);

        assertNull(heroDb.getHeroById("h1").getOptimizationRequest().getDamageMultipliers());
        assertNotNull(request.getDamageMultipliers(), "the live request must keep its multipliers");
    }

    @Test
    void aSecondSaveReplacesTheFirst() {
        final HeroDb heroDb = heroDbWith("h1");
        heroDb.saveOptimizationRequest(GSON.fromJson(RENDERER_JSON, OptimizationRequest.class));
        heroDb.saveOptimizationRequest(GSON.fromJson(
                "{\"hero\":{\"id\":\"h1\"},\"inputGlobalMustHaveStat\":\"Attack\"}", OptimizationRequest.class));

        final JsonObject saved = savedJson(heroDb, "h1");
        assertEquals("Attack", saved.get("inputGlobalMustHaveStat").getAsString());
        assertFalse(saved.has("inputMinItemGSLimit"));
    }

    @Test
    void aRequestForAnUnknownHeroSavesNothing() {
        final HeroDb heroDb = heroDbWith("h1");
        heroDb.saveOptimizationRequest(GSON.fromJson(
                "{\"hero\":{\"id\":\"other\"},\"inputSpdMinLimit\":5}", OptimizationRequest.class));

        assertNull(heroDb.getHeroById("h1").getOptimizationRequest());
    }

    @Test
    void changingSkillOptionsDropsTheMultipliersAStoredRunLeft() {
        final HeroDb heroDb = heroDbWith("h1");
        final Hero hero = heroDb.getHeroById("h1");
        hero.setDamageMultipliers(DamageMultipliers.builder().build());

        hero.setSkillOptions(SkillOptionsRequest.builder()
                .heroId("h1")
                .skillOptions(HeroSkillOptions.builder()
                        .S1(SingleSkillOptions.builder().skillEffect("normal").build())
                        .S2(SingleSkillOptions.builder().skillEffect("normal").build())
                        .S3(SingleSkillOptions.builder().skillEffect("normal").build())
                        .build())
                .build());

        assertFalse(hero.hasStoredDamageMultipliers());
    }

    @Test
    void reloadingHeroesDropsStoredMultipliersTheNewSkillDataMayContradict() {
        final HeroDb heroDb = heroDbWith("h1");
        final Hero reloaded = Hero.builder().id("h2").name("Nobody2").build();
        reloaded.setDamageMultipliers(DamageMultipliers.builder().build());
        heroDb.setHeroes(List.of(reloaded));

        assertFalse(heroDb.getHeroById("h2").hasStoredDamageMultipliers());
    }
}
