package com.fribbels.model;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Multi-hero runs derive the damage multipliers with {@link Hero#computeDamageMultipliers()};
 * single-hero runs used to send the ones JS {@code DamageCalc.getMultipliers} computed. The
 * fixture holds the JS output for eight real heroes (soul burn, barrier, penetration, extra
 * scaling, increased value, crit damage, speed scaling, hit-type options) at every selectable
 * option of every skill, produced by running the real damageCalc.js over herodata.json. Only
 * the fields the CPU damage code reads are compared: the other nine JS sends (constantValue
 * and the diff-penalty family) have no Java source; the CPU calculator never reads them and the
 * GPU kernel uploads them without using them. The cases labelled "b37" are the shapes that used to
 * diverge: a stale or empty effect name (JS resolves the first option and reads crit and support
 * off it, while the hit multiplier still follows the requested name) and partial or null
 * skillOptions (JS fills the first option's name for a missing skill).
 */
public class DamageMultipliersParityTest {

    private static final Gson GSON = new Gson();
    private static final Path FIXTURE = Path.of("1. Java", "10. Tests", "damageMultipliersParity.json");
    private static final List<String> FIELDS = List.of("rate", "pow", "targets", "selfHpScaling",
            "selfAtkScaling", "selfDefScaling", "selfSpdScaling", "increasedValue", "extraSelfHpScaling",
            "extraSelfDefScaling", "extraSelfAtkScaling", "cdmgIncrease", "penetration", "hitMulti", "support",
            "crit");

    @Test
    void javaMultipliersMatchTheOnesJsComputedForEveryOptionOfTheSampleHeroes() throws IOException {
        final JsonObject fixture = JsonParser.parseString(Files.readString(FIXTURE)).getAsJsonObject();
        int cases = 0;
        int soulBurn = 0;
        int b37 = 0;
        for (final JsonElement h : fixture.getAsJsonArray("heroes")) {
            final JsonObject hero = h.getAsJsonObject();
            final HeroSkills skills = GSON.fromJson(hero.get("skills"), HeroSkills.class);
            for (final JsonElement c : hero.getAsJsonArray("cases")) {
                final JsonObject testCase = c.getAsJsonObject();
                final String label = testCase.get("label").getAsString();
                assertCaseMatches(hero.get("name").getAsString(), skills, testCase);
                cases++;
                soulBurn += label.contains("soulburn") ? 1 : 0;
                b37 += label.startsWith("b37 ") ? 1 : 0;
            }
        }
        assertTrue(b37 > 50, "the b37 shapes shrank to " + b37 + " cases");
        assertTrue(cases > 50, "the fixture shrank to " + cases + " cases");
        assertTrue(soulBurn > 0, "no soul burn option was compared");
    }

    private static void assertCaseMatches(final String heroName, final HeroSkills skills, final JsonObject testCase) {
        final String where = heroName + " [" + testCase.get("label").getAsString() + "]";
        final JsonElement options = testCase.get("skillOptions");
        final DamageMultipliers java = Hero.builder()
                .name(heroName)
                .skills(skills)
                .skillOptions(options.isJsonNull() ? null : GSON.fromJson(options, HeroSkillOptions.class))
                .build()
                .computeDamageMultipliers();
        final Map<String, Object[]> javaFields = Map.ofEntries(
                Map.entry("rate", java.getRate()), Map.entry("pow", java.getPow()),
                Map.entry("targets", java.getTargets()),
                Map.entry("selfHpScaling", java.getSelfHpScaling()),
                Map.entry("selfAtkScaling", java.getSelfAtkScaling()),
                Map.entry("selfDefScaling", java.getSelfDefScaling()),
                Map.entry("selfSpdScaling", java.getSelfSpdScaling()),
                Map.entry("increasedValue", java.getIncreasedValue()),
                Map.entry("extraSelfHpScaling", java.getExtraSelfHpScaling()),
                Map.entry("extraSelfDefScaling", java.getExtraSelfDefScaling()),
                Map.entry("extraSelfAtkScaling", java.getExtraSelfAtkScaling()),
                Map.entry("cdmgIncrease", java.getCdmgIncrease()),
                Map.entry("penetration", java.getPenetration()),
                Map.entry("hitMulti", java.getHitMulti()), Map.entry("support", java.getSupport()),
                Map.entry("crit", java.getCrit()));
        final JsonObject js = testCase.getAsJsonObject("js");
        for (final String field : FIELDS) {
            for (int s = 0; s < 3; s++) {
                assertEquals(js.getAsJsonArray(field).get(s).getAsFloat(),
                        ((Number) javaFields.get(field)[s]).floatValue(), 0f,
                        where + " " + field + "[" + s + "]");
            }
        }
    }
}
