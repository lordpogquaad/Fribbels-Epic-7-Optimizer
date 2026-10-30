package com.fribbels.handler;

import com.fribbels.model.ArtifactStats;
import com.fribbels.model.BaseStats;
import com.fribbels.request.ArtifactStatsRequest;
import com.fribbels.request.BaseStatsRequest;
import com.fribbels.request.EquipItemsOnHeroRequest;
import com.google.gson.Gson;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Gson binds these @Builder classes by reflection. On JDK 26+ (JEP 500) setting a final field that
 * way warns, and a future release throws, so their fields must stay non-final.
 */
class GsonBoundFieldsTest {

    private static final Gson GSON = new Gson();

    @Test
    void gsonBoundClassesHaveNoFinalInstanceFields() {
        final List<Class<?>> classes = List.of(ArtifactStats.class, BaseStats.class,
                ArtifactStatsRequest.class, BaseStatsRequest.class, EquipItemsOnHeroRequest.class);
        for (final Class<?> type : classes) {
            for (final Field field : type.getDeclaredFields()) {
                final int mods = field.getModifiers();
                assertTrue(Modifier.isStatic(mods) || !Modifier.isFinal(mods),
                        type.getSimpleName() + "." + field.getName() + " is final");
            }
        }
    }

    @Test
    void gsonStillPopulatesThem() {
        final BaseStatsRequest baseStats = GSON.fromJson(
                "{\"baseStatsByName\":{\"Rinak\":{\"lv60SixStarFullyAwakened\":{\"atk\":1112}}}}",
                BaseStatsRequest.class);
        assertEquals(1112, baseStats.getBaseStatsByName().get("Rinak").getLv60SixStarFullyAwakened().getAtk());

        final ArtifactStatsRequest artifacts = GSON.fromJson(
                "{\"artifactStatsByName\":{\"Elbris\":{\"attack\":39.0}}}", ArtifactStatsRequest.class);
        assertEquals(39f, artifacts.getArtifactStatsByName().get("Elbris").getAttack());

        final EquipItemsOnHeroRequest equip = GSON.fromJson(
                "{\"heroId\":\"h1\",\"itemIds\":[\"i1\"]}", EquipItemsOnHeroRequest.class);
        assertEquals("h1", equip.getHeroId());
        assertNotNull(equip.getItemIds());
    }
}
