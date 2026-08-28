package com.fribbels.handler;

import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.enums.Gear;
import com.fribbels.enums.HeroFilter;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.model.Item;
import com.fribbels.model.MergeHero;
import com.fribbels.request.EquipItemsOnHeroRequest;
import com.fribbels.request.HeroesRequest;
import com.fribbels.request.IdRequest;
import com.fribbels.request.IdsRequest;
import com.fribbels.request.ItemsRequest;
import com.fribbels.request.MergeRequest;
import com.fribbels.response.GetAllItemsResponse;
import com.fribbels.response.GetItemByIdResponse;
import com.google.common.collect.ImmutableList;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.Strings;

import com.fribbels.model.Stat;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.logging.Logger;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@AllArgsConstructor
public class ItemsRequestHandler extends RequestHandler implements HttpHandler {

    private static final Logger logger = Logger.getLogger(ItemsRequestHandler.class.getName());

    private final ItemDb itemDb;
    private final HeroDb heroDb;
    private final BaseStatsDb baseStatsDb;
    private final HeroesRequestHandler heroesRequestHandler;

    @Override
    public void handle(final HttpExchange exchange) throws IOException {
        logger.info("===================== ItemsRequestHandler =====================");
        final String path = exchange.getRequestURI().getPath();

        logger.info("Path: " + path);

        try {
            switch (path) {
                case "/items/addItems":
                    final ItemsRequest addItemsRequest = parseRequest(exchange, ItemsRequest.class);
                    sendResponse(exchange, addItems(addItemsRequest));
                    return;
                case "/items/mergeItems":
                    final MergeRequest mergeItemsRequest = parseRequest(exchange, MergeRequest.class);
                    sendResponse(exchange, mergeItems(mergeItemsRequest));
                    return;
                case "/items/mergeHeroes":
                    final MergeRequest mergeHeroesRequest = parseRequest(exchange, MergeRequest.class);
                    sendResponse(exchange, mergeHeroes(mergeHeroesRequest));
                    return;
                case "/items/setItems":
                    final ItemsRequest setItemsRequest = parseRequest(exchange, ItemsRequest.class);
                    sendResponse(exchange, setItems(setItemsRequest));
                    return;
                case "/items/getAllItems":
                    sendResponse(exchange, getAllItems());
                    return;
                case "/items/getItemById":
                    final IdRequest getItemByIdRequest = parseRequest(exchange, IdRequest.class);
                    sendResponse(exchange, getItemById(getItemByIdRequest));
                    return;
                case "/items/getItemsByIds":
                    final IdsRequest getItemsByIdsRequest = parseRequest(exchange, IdsRequest.class);
                    sendResponse(exchange, getItemsByIds(getItemsByIdsRequest));
                    return;
                case "/items/getItemByIngameId":
                    final IdRequest getItemByIngameIdRequest = parseRequest(exchange, IdRequest.class);
                    sendResponse(exchange, getItemByIngameId(getItemByIngameIdRequest));
                    return;
                case "/items/lockItems":
                    final IdsRequest lockItemsRequest = parseRequest(exchange, IdsRequest.class);
                    sendResponse(exchange, lockItems(lockItemsRequest));
                    return;
                case "/items/unlockItems":
                    final IdsRequest unlockItemsRequest = parseRequest(exchange, IdsRequest.class);
                    sendResponse(exchange, unlockItems(unlockItemsRequest));
                    return;
                case "/items/deleteItems":
                    final IdsRequest deleteItemsRequest = parseRequest(exchange, IdsRequest.class);
                    sendResponse(exchange, deleteItems(deleteItemsRequest));
                    return;
                case "/items/editItems":
                    final ItemsRequest editItemsRequest = parseRequest(exchange, ItemsRequest.class);
                    sendResponse(exchange, editItems(editItemsRequest));
                    return;
                default:
                    logger.warning("No handler found for " + path);
            }
        } catch (final RuntimeException e) {
            logger.severe("Error handling request: " + e.getMessage());
        }

        sendResponse(exchange, "ERROR");
    }

    /**
     * Copies the {@code modified} flag from old substats to new substats by
     * position so that
     * user-marked modifications survive a re-import. Also carries forward user-set
     * fields
     * (pinMod, pinModOff, allowedTargetStats) from the old stat — scanners never
     * populate
     * these, so the new stat always has null for them. Position matching is used
     * because a
     * modified substat's Java {@code type} may have been changed from the original
     * game value,
     * making type-based lookup unreliable.
     */
    private static List<Stat> preserveSubstatModifications(final List<Stat> oldSubs, final List<Stat> newSubs) {
        if (oldSubs == null || newSubs == null || oldSubs.isEmpty())
            return newSubs;
        final List<Stat> result = new ArrayList<>(newSubs.size());
        for (int i = 0; i < newSubs.size(); i++) {
            final Stat ns = newSubs.get(i);
            if (ns == null) {
                result.add(null);
                continue;
            }
            final Stat os = i < oldSubs.size() ? oldSubs.get(i) : null;
            // User-set fields are never present in scan data — always take from the old
            // stat.
            final Boolean pinMod = (os != null) ? os.getPinMod() : null;
            final Boolean pinModOff = (os != null) ? os.getPinModOff() : null;
            final List<String> allowedTargetStats = (os != null) ? os.getAllowedTargetStats() : null;
            final Boolean oldModified = (os != null) ? os.getModified() : null;
            final boolean forceModified = Boolean.TRUE.equals(oldModified) && !Boolean.TRUE.equals(ns.getModified());
            result.add(new Stat(
                    ns.getType(), ns.getValue(), ns.getRolls(), ns.getIngameRolls(),
                    forceModified ? Boolean.TRUE : ns.getModified(),
                    pinMod, pinModOff, allowedTargetStats));
        }
        return result;
    }

    public String addItems(final ItemsRequest request) {
        itemDb.addItems(request.getItems());

        return "";
    }

    public String mergeItems(final MergeRequest request) {
        final List<Item> newItems = request.getItems()
                .stream()
                .filter(x -> x.getEnhance() >= request.getEnhanceLimit())
                .collect(Collectors.toList());
        final List<Item> existingItems = itemDb.getAllItems();

        final Map<Integer, List<Item>> itemsByHash = new HashMap<>();
        final Map<String, Item> itemsByIngameId = new HashMap<>();

        // Note down matching items
        for (final Item item : existingItems) {
            // First check ingameId
            final String ingameId = item.getIngameId();

            if (ingameId != null && itemsByIngameId.containsKey(ingameId)) {
                // Second existing item with the same ingameId — keep the first in the ingameId
                // map and index this one only by hash so it can still be matched by stats.
                itemsByHash.computeIfAbsent(item.getHash(), k -> new ArrayList<>()).add(item);
                continue;
            } else {
                itemsByIngameId.put(ingameId, item);
            }

            // Then check stats
            final int hash = item.getHash();

            if (itemsByHash.containsKey(hash)) {
                final List<Item> matchingItems = itemsByHash.get(hash);
                matchingItems.add(item);
            } else {
                itemsByHash.put(hash, new ArrayList<>(Collections.singletonList(item)));
            }
        }

        // Replace matching new items with their existing versions
        for (int i = 0; i < newItems.size(); i++) {
            final Item newItem = newItems.get(i);

            // Check for ingameId matches first
            final String ingameId = newItem.getIngameId();

            if (ingameId != null && itemsByIngameId.containsKey(ingameId)) {
                // Remove from the map so a duplicate incoming item (e.g. network retransmit)
                // cannot match the same existing item a second time, which would store it
                // twice.
                final Item matchingExistingItem = itemsByIngameId.remove(ingameId);

                matchingExistingItem.setIngameId(newItem.getIngameId());
                matchingExistingItem.setName(newItem.getName());
                matchingExistingItem.setSubstats(
                        preserveSubstatModifications(matchingExistingItem.getSubstats(), newItem.getSubstats()));
                matchingExistingItem.setOp(newItem.getOp());
                matchingExistingItem.setStorage(newItem.getStorage());
                matchingExistingItem.setAugmentedStats(newItem.getAugmentedStats());
                matchingExistingItem.setReforgedStats(newItem.getReforgedStats());
                matchingExistingItem.setEnhance(newItem.getEnhance());
                matchingExistingItem.setUpgradeable(newItem.getUpgradeable());
                matchingExistingItem.setConvertable(newItem.getConvertable());
                matchingExistingItem.setReforgeable(newItem.getReforgeable());
                matchingExistingItem.setDuplicateId(newItem.getDuplicateId());
                matchingExistingItem.setIngameEquippedId(newItem.getIngameEquippedId());
                matchingExistingItem.setOtherworldly(newItem.getOtherworldly());

                // Special cases for merging unknown items
                if (newItem.getLevel() == 0) {
                    if (matchingExistingItem.getLevel() == null) {
                        matchingExistingItem.setLevel(newItem.getLevel());
                    }
                } else {
                    matchingExistingItem.setLevel(newItem.getLevel());
                }

                if (newItem.getMain().getValue() == null || newItem.getMain().getValue() == 0) {
                    if (matchingExistingItem.getMain().getValue() == null) {
                        matchingExistingItem.setMain(newItem.getMain());
                    }
                } else {
                    matchingExistingItem.setMain(newItem.getMain());
                }

                newItems.set(i, matchingExistingItem);
                continue;
            }

            // Then check stat matches
            final int hash = newItem.getHash();

            if (itemsByHash.containsKey(hash)) {
                final List<Item> matchingItems = itemsByHash.get(hash);

                // Pick the first hash-candidate that isn't provably a DIFFERENT physical
                // item: when the candidate and the new item BOTH carry a non-null ingameId
                // and they differ, they're distinct pieces that merely share identical stats
                // (getHash() excludes ingameId), so skip it — otherwise the new piece is
                // merged into the wrong item and then dropped by the setItems id-dedup
                // (silent inventory loss). A null ingameId on either side is ambiguous
                // (e.g. the same item re-reported), so those still merge by hash as before.
                Item matchingExistingItem = null;
                for (int k = 0; k < matchingItems.size(); k++) {
                    final Item candidate = matchingItems.get(k);
                    final String candidateIngameId = candidate.getIngameId();
                    if (candidateIngameId != null
                            && newItem.getIngameId() != null
                            && !candidateIngameId.equals(newItem.getIngameId())) {
                        continue;
                    }
                    matchingExistingItem = matchingItems.remove(k);
                    break;
                }

                if (matchingExistingItem != null) {

                    newItems.set(i, matchingExistingItem);

                    matchingExistingItem.setIngameId(newItem.getIngameId());
                    matchingExistingItem.setName(newItem.getName());
                    matchingExistingItem.setSubstats(
                            preserveSubstatModifications(matchingExistingItem.getSubstats(), newItem.getSubstats()));
                    matchingExistingItem.setOp(newItem.getOp());
                    matchingExistingItem.setStorage(newItem.getStorage());
                    matchingExistingItem.setMain(newItem.getMain());
                    matchingExistingItem.setAugmentedStats(newItem.getAugmentedStats());
                    matchingExistingItem.setReforgedStats(newItem.getReforgedStats());
                    matchingExistingItem.setEnhance(newItem.getEnhance());
                    matchingExistingItem.setLevel(newItem.getLevel());
                    matchingExistingItem.setUpgradeable(newItem.getUpgradeable());
                    matchingExistingItem.setConvertable(newItem.getConvertable());
                    matchingExistingItem.setReforgeable(newItem.getReforgeable());
                    matchingExistingItem.setDuplicateId(newItem.getDuplicateId());
                    matchingExistingItem.setIngameEquippedId(newItem.getIngameEquippedId());
                    matchingExistingItem.setOtherworldly(newItem.getOtherworldly());
                }
            }
        }

        // Go through heroes and unequip unmatched items
        final List<Hero> allHeroes = heroDb.getAllHeroes();
        final Set<String> newItemIds = newItems.stream().map(Item::getId).collect(Collectors.toSet());

        for (final Hero hero : allHeroes) {
            final Map<Gear, Item> equipment = hero.getEquipment();
            unequipIfNotExists(equipment, newItemIds, Gear.WEAPON);
            unequipIfNotExists(equipment, newItemIds, Gear.HELMET);
            unequipIfNotExists(equipment, newItemIds, Gear.ARMOR);
            unequipIfNotExists(equipment, newItemIds, Gear.NECKLACE);
            unequipIfNotExists(equipment, newItemIds, Gear.RING);
            unequipIfNotExists(equipment, newItemIds, Gear.BOOTS);

            final List<HeroStats> builds = hero.getBuilds();
            if (builds == null)
                continue;

            // Clean up builds
            final List<HeroStats> buildsToRemove = new ArrayList<>();
            for (final HeroStats build : hero.getBuilds()) {
                final List<String> buildItems = build.getItems();
                for (final String itemId : buildItems) {
                    if (!newItemIds.contains(itemId)) {
                        buildsToRemove.add(build);
                    }
                }
            }
            builds.removeAll(buildsToRemove);

            for (final HeroStats build : hero.getBuilds()) {
                final HeroStats baseStats = baseStatsDb.getBaseStatsByName(hero.getName(), hero.getStars());
                if (build.getMods() != null && build.getMods().stream().anyMatch(Objects::nonNull)) {
                    heroesRequestHandler.addStatsToBuild(hero, baseStats, build, true);
                } else {
                    heroesRequestHandler.addStatsToBuild(hero, baseStats, build, false);
                }
            }
        }

        for (final Item item : newItems) {
            final String equippedBy = item.getEquippedById();
            final Hero hero = heroDb.getHeroById(equippedBy);

            if (hero == null) {
                item.setEquippedByName(null);
                item.setEquippedById(null);
                continue;
            }

            final Map<Gear, Item> equipment = hero.getEquipment();
            if (!equipment.containsKey(item.getGear())) {
                item.setEquippedByName(null);
                item.setEquippedById(null);
                continue;
            }

            final Item equippedItem = equipment.get(item.getGear());
            if (!Strings.CS.equals(equippedItem.getId(), item.getId())) {
                item.setEquippedByName(null);
                item.setEquippedById(null);
                continue;
            }
        }

        itemDb.setItems(newItems);

        return "";
    }

    public String mergeHeroes(final MergeRequest request) {
        mergeItems(request);

        final List<Item> existingItems = itemDb.getAllItems();
        final Map<String, List<Item>> itemsByIngameEquippedId = existingItems.stream()
                .filter(item -> item.getIngameEquippedId() != null)
                .collect(Collectors.groupingBy(Item::getIngameEquippedId, Collectors.toList()));

        final List<MergeHero> mergeHeroes = request.getMergeHeroes();

        // Index scan heroes by name (first per name — used as name-based fallback only)
        final Map<String, MergeHero> mergeHeroesByName = mergeHeroes.stream()
                .collect(Collectors.toMap(MergeHero::getName, x -> x, (x, y) -> x));

        // Index scan heroes by in-game unit ID (unique per hero instance)
        final Map<String, MergeHero> mergeHeroesByIngameId = mergeHeroes.stream()
                .collect(Collectors.toMap(MergeHero::getId, x -> x, (x, y) -> x));

        final List<Hero> existingHeroes = heroDb.getAllHeroes();

        // All in-game unit IDs present in this scan. A non-null-id optimizer hero whose
        // ingameId is missing from this set no longer exists on the account (fed,
        // imprinted, sold, etc. since the previous import) and is "stale".
        final Set<String> scanIds = mergeHeroes.stream()
                .map(MergeHero::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        // Legacy scans without ids provide no signal to distinguish "gone" from "just not
        // in this filter" — skip pruning entirely rather than risk deleting real heroes.
        final boolean pruneStaleHeroes = !scanIds.isEmpty();
        if (!pruneStaleHeroes) {
            logger.info("mergeHeroes: scan provided no ingame ids; skipping stale-hero pruning");
        }

        // Optimizer heroes that already have an in-game unit ID linked
        final Map<String, Hero> existingHeroesByIngameId = new HashMap<>();
        // Optimizer heroes not yet linked — keyed by name, first per name wins
        final Map<String, Hero> existingHeroesByUnlinkedName = new HashMap<>();
        // All current optimizer hero names (used for generating unique display names)
        final Set<String> optimizerNames = new HashSet<>();
        // Stale heroes available for relinking, queued per base name (FIFO) so N stale
        // copies of a name correctly pair off against N new scan copies of that name.
        final Map<String, Deque<Hero>> staleHeroesByBaseName = new HashMap<>();
        final List<Hero> staleHeroes = new ArrayList<>();
        final Map<Hero, String> staleHeroOriginalIngameId = new IdentityHashMap<>();

        for (final Hero hero : existingHeroes) {
            optimizerNames.add(hero.getName());
            final String heroIngameId = hero.getIngameId();
            if (heroIngameId != null && pruneStaleHeroes && !scanIds.contains(heroIngameId)) {
                staleHeroOriginalIngameId.put(hero, heroIngameId);
                hero.setIngameId(null);
                staleHeroesByBaseName
                        .computeIfAbsent(baseName(hero.getName()), k -> new ArrayDeque<>())
                        .add(hero);
                staleHeroes.add(hero);
            } else if (heroIngameId != null) {
                existingHeroesByIngameId.put(heroIngameId, hero);
            } else {
                existingHeroesByUnlinkedName.putIfAbsent(hero.getName(), hero);
            }
        }
        final Set<Hero> staleHeroSet = Collections.newSetFromMap(new IdentityHashMap<>());
        staleHeroSet.addAll(staleHeroes);

        // Base names of all optimizer heroes (e.g. "Vivian" for both "Vivian" and
        // "Vivian #2")
        final Set<String> optimizerBaseNames = existingHeroes.stream()
                .map(Hero::getName)
                .filter(Objects::nonNull)
                .map(ItemsRequestHandler::baseName)
                .collect(Collectors.toSet());

        if (request.getHeroFilter() == HeroFilter.OPTIMIZER) {
            existingHeroes.forEach(hero -> {
                // Stale heroes are handled solely through the stale-relink queue below so
                // that multiple stale/new copies of one name pair off correctly.
                if (staleHeroSet.contains(hero))
                    return;

                final String heroIngameId = hero.getIngameId();
                final MergeHero mergeHero;
                if (heroIngameId != null) {
                    // Primary: match by in-game ID (handles duplicate heroes correctly)
                    mergeHero = mergeHeroesByIngameId.get(heroIngameId);
                } else {
                    // Fallback: match by name and link for future merges (only if scan provides an
                    // id)
                    mergeHero = mergeHeroesByName.get(hero.getName());
                    if (mergeHero != null && mergeHero.getId() != null) {
                        hero.setIngameId(mergeHero.getId());
                        existingHeroesByIngameId.put(mergeHero.getId(), hero);
                        // Remove from unlinked map so a second duplicate doesn't re-claim this entry
                        existingHeroesByUnlinkedName.remove(hero.getName());
                    }
                }
                if (mergeHero == null)
                    return;

                final List<Item> equippedItems = itemsByIngameEquippedId.getOrDefault(mergeHero.getId(),
                        ImmutableList.of());
                heroesRequestHandler.equipItemsOnHero(EquipItemsOnHeroRequest.builder()
                        .heroId(hero.getId())
                        .itemIds(equippedItems.stream().map(Item::getId).collect(Collectors.toList()))
                        .useReforgeStats(true)
                        .build());
            });

            // Create entries for duplicate scan heroes (same base name, different ingameId)
            // that weren't matched to any existing optimizer entry above
            mergeHeroes.stream()
                    .filter(mh -> !existingHeroesByIngameId.containsKey(mh.getId()))
                    .filter(mh -> optimizerBaseNames.contains(mh.getName()))
                    .forEach(mh -> processSingleMergeHero(mh,
                            existingHeroesByIngameId, existingHeroesByUnlinkedName, staleHeroesByBaseName,
                            optimizerNames, itemsByIngameEquippedId));
        }

        if (request.getHeroFilter() == HeroFilter.SIX_STAR) {
            mergeHeroes.stream()
                    .filter(x -> Integer.valueOf(6).equals(x.getStars()))
                    .forEach(mergeHero -> processSingleMergeHero(mergeHero,
                            existingHeroesByIngameId, existingHeroesByUnlinkedName, staleHeroesByBaseName,
                            optimizerNames, itemsByIngameEquippedId));
        }

        if (request.getHeroFilter() == HeroFilter.FIVE_STAR) {
            mergeHeroes.stream()
                    .filter(x -> Integer.valueOf(6).equals(x.getStars()) || Integer.valueOf(5).equals(x.getStars()))
                    .forEach(mergeHero -> processSingleMergeHero(mergeHero,
                            existingHeroesByIngameId, existingHeroesByUnlinkedName, staleHeroesByBaseName,
                            optimizerNames, itemsByIngameEquippedId));
        }

        // Post-pass: any stale hero that never got relinked to a scan unit no longer
        // exists on the account — remove it (and unequip its items) so it doesn't linger.
        int relinkedCount = 0;
        int prunedCount = 0;
        for (final Hero staleHero : staleHeroes) {
            if (staleHero.getIngameId() != null) {
                relinkedCount++;
                continue;
            }
            final String oldIngameId = staleHeroOriginalIngameId.get(staleHero);
            logger.info("PRUNED STALE HERO: " + staleHero.getName() + " (ingameId " + oldIngameId + ")");
            heroesRequestHandler.removeHeroById(IdRequest.builder().id(staleHero.getId()).build());
            prunedCount++;
        }
        if (pruneStaleHeroes) {
            logger.info("mergeHeroes: relinked " + relinkedCount + ", pruned " + prunedCount);
        }

        return "";
    }

    // Strips the trailing " #N" duplicate-copy suffix optimizer hero names use
    // (e.g. "Vivian #2" -> "Vivian") so heroes can be matched/queued by base name.
    private static String baseName(final String name) {
        if (name == null)
            return null;
        return name.replaceAll("\\s#\\d+$", "");
    }

    // Pops the next available stale hero of the given base name, if any, removing the
    // queue once it's drained.
    private static Hero popStaleHero(final String baseName, final Map<String, Deque<Hero>> staleHeroesByBaseName) {
        if (baseName == null)
            return null;
        final Deque<Hero> queue = staleHeroesByBaseName.get(baseName);
        if (queue == null || queue.isEmpty())
            return null;
        final Hero hero = queue.pollFirst();
        if (queue.isEmpty())
            staleHeroesByBaseName.remove(baseName);
        return hero;
    }

    private void processSingleMergeHero(
            final MergeHero mergeHero,
            final Map<String, Hero> existingHeroesByIngameId,
            final Map<String, Hero> existingHeroesByUnlinkedName,
            final Map<String, Deque<Hero>> staleHeroesByBaseName,
            final Set<String> optimizerNames,
            final Map<String, List<Item>> itemsByIngameEquippedId) {

        final String ingameHeroId = mergeHero.getId();
        final String baseName = mergeHero.getName();

        final Hero hero;
        // Only use the ingameId map when the id is non-null — a null id key would match
        // every subsequent scan hero whose scanner also omits the id field.
        if (ingameHeroId != null && existingHeroesByIngameId.containsKey(ingameHeroId)) {
            // Already linked to this in-game unit — use directly
            hero = existingHeroesByIngameId.get(ingameHeroId);
            logger.info("EXISTING HERO BY INGAME ID: " + hero.getName());
        } else {
            final Hero staleHero = popStaleHero(baseName, staleHeroesByBaseName);
            if (staleHero != null) {
                // A previously-linked optimizer hero whose old ingameId fell out of the scan —
                // reuse it (keeps its id/priorities/builds) and relink to the new unit.
                hero = staleHero;
                if (ingameHeroId != null) {
                    hero.setIngameId(ingameHeroId);
                    existingHeroesByIngameId.put(ingameHeroId, hero);
                }
                logger.info("RELINKED STALE HERO: " + hero.getName() + " -> " + ingameHeroId);
            } else if (existingHeroesByUnlinkedName.containsKey(baseName)) {
                // Unlinked optimizer hero with matching name — link it now
                // Remove from unlinked map so a second duplicate doesn't claim the same hero
                hero = existingHeroesByUnlinkedName.remove(baseName);
                if (ingameHeroId != null) {
                    hero.setIngameId(ingameHeroId);
                    existingHeroesByIngameId.put(ingameHeroId, hero);
                }
                logger.info("LINKED EXISTING HERO: " + hero.getName() + " -> " + ingameHeroId);
            } else {
                // No matching optimizer hero — create a new one with a unique display name
                final Hero heroData = mergeHero.getData();
                if (heroData == null)
                    return;

                // Generate a "#N" suffix to avoid colliding with existing optimizer hero names
                String displayName = baseName;
                int copyNum = 2;
                while (optimizerNames.contains(displayName)) {
                    displayName = baseName + " #" + copyNum++;
                }
                heroData.setName(displayName);
                optimizerNames.add(displayName);

                if (ingameHeroId != null) {
                    heroData.setIngameId(ingameHeroId);
                }

                heroesRequestHandler.addHeroes(HeroesRequest.builder()
                        .heroes(Collections.singletonList(heroData))
                        .build());
                final Hero createdHero = heroDb.getHeroById(heroData.getId());
                if (createdHero != null && ingameHeroId != null) {
                    existingHeroesByIngameId.put(ingameHeroId, createdHero);
                }
                hero = createdHero;
                logger.info("ADDED HERO: " + displayName);
            }
        }

        if (hero == null)
            return;

        final List<Item> equippedItems = itemsByIngameEquippedId.getOrDefault(ingameHeroId, ImmutableList.of());
        heroesRequestHandler.equipItemsOnHero(EquipItemsOnHeroRequest.builder()
                .heroId(hero.getId())
                .itemIds(equippedItems.stream().map(Item::getId).collect(Collectors.toList()))
                .useReforgeStats(true)
                .build());
    }

    private void unequipIfNotExists(final Map<Gear, Item> equipment, final Set<String> newItemIds, final Gear gear) {
        if (equipment.containsKey(gear)) {
            final Item item = equipment.get(gear);
            if (!newItemIds.contains(item.getId())) {
                equipment.remove(gear);
            }
        }

    }

    public String setItems(final ItemsRequest request) {
        itemDb.setItems(request.getItems());

        return "";
    }

    public String editItems(final ItemsRequest request) {
        final List<Item> items = request.getItems();
        for (final Item item : items) {
            final Item dbItem = itemDb.getItemById(item.getId());
            if (dbItem == null) {
                logger.warning("No dbitem matching: " + item.getId());
                continue;
            }

            dbItem.setEquippedByName(item.getEquippedByName());
            dbItem.setEquippedById(item.getEquippedById());
            dbItem.setLocked(item.isLocked());
            dbItem.setDisableMods(item.isDisableMods());
            if (item.getAugmentedStats() != null)
                dbItem.setAugmentedStats(item.getAugmentedStats());
            if (item.getReforgedStats() != null)
                dbItem.setReforgedStats(item.getReforgedStats());
            dbItem.setEnhance(item.getEnhance());
            dbItem.setGear(item.getGear());
            dbItem.setLevel(item.getLevel());
            dbItem.setMain(item.getMain());
            dbItem.setRank(item.getRank());
            dbItem.setSet(item.getSet());
            dbItem.setSubstats(item.getSubstats());
            dbItem.setOp(item.getOp());
            dbItem.setStorage(item.getStorage());
            dbItem.setReforgeable(item.getReforgeable());
            dbItem.setUpgradeable(item.getUpgradeable());
            dbItem.setConvertable(item.getConvertable());
            dbItem.setMaterial(item.getMaterial());
            dbItem.setAllowedMods(item.getAllowedMods());
            itemDb.calculateWss(dbItem);
        }

        return "";
    }

    public String lockItems(final IdsRequest request) {
        logger.info(String.valueOf(request));
        final List<Item> items = itemDb.getItemsById(request.getIds());
        for (final Item item : items) {
            if (item == null)
                continue;
            item.setLocked(true);
        }

        return "";
    }

    public String unlockItems(final IdsRequest request) {
        logger.info(String.valueOf(request));
        final List<Item> items = itemDb.getItemsById(request.getIds());
        for (final Item item : items) {
            if (item == null)
                continue;
            item.setLocked(false);
        }

        return "";
    }

    public String deleteItems(final IdsRequest request) {
        logger.info(String.valueOf(request.getIds()));
        final List<Item> items = itemDb.getItemsById(request.getIds());

        for (final Item item : items) {
            if (item == null)
                continue;

            logger.info("Deleting: " + item);
            itemDb.deleteItem(item.getId());
        }

        return "";
    }

    public String getAllItems() {
        final List<Item> items = augmentItemData(itemDb.getAllItems());
        final GetAllItemsResponse response = GetAllItemsResponse.builder()
                .items(items)
                .build();

        return toJson(response);
    }

    public String getItemById(final IdRequest request) {
        final Item item = itemDb.getItemById(request.getId());
        logger.info(String.valueOf(request));
        final GetItemByIdResponse response = GetItemByIdResponse.builder()
                .item(item)
                .build();

        return toJson(response);
    }

    public String getItemByIngameId(final IdRequest request) {
        final List<Item> items = itemDb.getAllItems();
        final Optional<Item> match = items.stream()
                .filter(x -> Strings.CS.equals(x.getIngameId(), request.getId()))
                .findFirst();

        logger.info(String.valueOf(request));

        final GetItemByIdResponse response = GetItemByIdResponse.builder()
                .item(match.orElse(null))
                .build();

        return toJson(response);
    }

    public String getItemsByIds(final IdsRequest request) {
        if (request.getIds() == null) {
            return "";
        }

        final List<Item> items = request.getIds()
                .stream()
                .map(itemDb::getItemById)
                .collect(Collectors.toList());

        final GetAllItemsResponse response = GetAllItemsResponse.builder()
                .items(items)
                .build();

        return toJson(response);
    }

    private List<Item> augmentItemData(final List<Item> items) {
        final Map<Integer, List<Item>> itemsByHash = new HashMap<>();

        for (final Item item : items) {
            final int hash = item.getHash();
            itemsByHash.computeIfAbsent(hash, k -> new ArrayList<>()).add(item);
        }

        final Map<String, String> duplicateIdByItemId = new HashMap<>();
        itemsByHash.forEach((hash, matchingItems) -> {
            if (matchingItems.size() > 1) {
                matchingItems.forEach(item -> duplicateIdByItemId.put(item.getId(), "DUPLICATE" + hash));
            }
        });

        return items.stream()
                .map(item -> item.withDuplicateId(duplicateIdByItemId.getOrDefault(item.getId(), "")))
                .collect(Collectors.toList());
    }
}
