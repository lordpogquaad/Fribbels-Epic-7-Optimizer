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
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.logging.Logger;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
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

            if (ingameId != null && itemsByIngameId.containsKey(ingameId) && itemsByHash.containsKey(item.getHash())) {
                final List<Item> matchingItems = itemsByHash.get(item.getHash());

                matchingItems.add(item);
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
                final Item matchingExistingItem = itemsByIngameId.get(ingameId);

                matchingExistingItem.setIngameId(newItem.getIngameId());
                matchingExistingItem.setName(newItem.getName());
                matchingExistingItem.setSubstats(newItem.getSubstats());
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

                if (!matchingItems.isEmpty()) {
                    final Item matchingExistingItem = matchingItems.remove(0);

                    newItems.set(i, matchingExistingItem);

                    matchingExistingItem.setIngameId(newItem.getIngameId());
                    matchingExistingItem.setName(newItem.getName());
                    matchingExistingItem.setSubstats(newItem.getSubstats());
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
            if (!StringUtils.equals(equippedItem.getId(), item.getId())) {
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
                .collect(Collectors.groupingBy(
                        Item::getIngameEquippedId,
                        Collectors.toList()));

        final List<MergeHero> mergeHeroes = request.getMergeHeroes();
        final Map<String, MergeHero> mergeHeroesByName = mergeHeroes
                .stream()
                .collect(Collectors.toMap(
                        MergeHero::getName,
                        x -> x,
                        (x, y) -> x));

        final List<Hero> existingHeroes = heroDb.getAllHeroes();
        final Map<String, Hero> existingHeroesByName = existingHeroes
                .stream()
                .collect(Collectors.toMap(
                        Hero::getName,
                        x -> x,
                        (x, y) -> x));

        if (request.getHeroFilter() == HeroFilter.OPTIMIZER) {
            existingHeroes.forEach(hero -> {
                final String name = hero.getName();

                final MergeHero mergeHero = mergeHeroesByName.getOrDefault(name, null);
                if (mergeHero == null)
                    return;

                final String ingameHeroId = mergeHero.getId();
                final List<Item> itemsEquippedByIngameHeroId = itemsByIngameEquippedId.getOrDefault(ingameHeroId,
                        ImmutableList.of());

                heroesRequestHandler.equipItemsOnHero(EquipItemsOnHeroRequest.builder()
                        .heroId(hero.getId())
                        .itemIds(itemsEquippedByIngameHeroId
                                .stream()
                                .map(Item::getId)
                                .collect(Collectors.toList()))
                        .useReforgeStats(true)
                        .build());
            });
        }

        if (request.getHeroFilter() == HeroFilter.SIX_STAR) {
            final Set<String> alreadyMergedNames = new HashSet<>();
            mergeHeroes
                    .stream()
                    .filter(x -> x.getStars() == 6)
                    .forEach(mergeHero -> {
                        final String name = mergeHero.getName();
                        if (alreadyMergedNames.contains(name))
                            return;
                        alreadyMergedNames.add(name);

                        final Hero hero;
                        if (existingHeroesByName.containsKey(name)) {
                            hero = existingHeroesByName.get(name);
                            logger.info("EXISTING HERO");
                        } else {
                            final Hero heroData = mergeHero.getData();
                            if (heroData == null)
                                return;
                            heroesRequestHandler.addHeroes(HeroesRequest
                                    .builder()
                                    .heroes(Collections.singletonList(heroData))
                                    .build());

                            hero = heroDb.getHeroById(heroData.getId());
                            logger.info("ADDED HERO" + hero);
                        }

                        final String ingameHeroId = mergeHero.getId();
                        final List<Item> itemsEquippedByIngameHeroId = itemsByIngameEquippedId
                                .getOrDefault(ingameHeroId, ImmutableList.of());

                        heroesRequestHandler.equipItemsOnHero(EquipItemsOnHeroRequest.builder()
                                .heroId(hero.getId())
                                .itemIds(itemsEquippedByIngameHeroId
                                        .stream()
                                        .map(Item::getId)
                                        .collect(Collectors.toList()))
                                .useReforgeStats(true)
                                .build());
                    });
        }

        if (request.getHeroFilter() == HeroFilter.FIVE_STAR) {
            final Set<String> alreadyMergedNames = new HashSet<>();
            mergeHeroes
                    .stream()
                    .filter(x -> x.getStars() == 6 || x.getStars() == 5)
                    .forEach(mergeHero -> {
                        final String name = mergeHero.getName();
                        if (alreadyMergedNames.contains(name))
                            return;
                        alreadyMergedNames.add(name);

                        final Hero hero;
                        if (existingHeroesByName.containsKey(name)) {
                            hero = existingHeroesByName.get(name);
                            logger.info("EXISTING HERO");
                        } else {
                            final Hero heroData = mergeHero.getData();
                            if (heroData == null)
                                return;
                            heroesRequestHandler.addHeroes(HeroesRequest
                                    .builder()
                                    .heroes(Collections.singletonList(heroData))
                                    .build());

                            hero = heroDb.getHeroById(heroData.getId());
                            logger.info("ADDED HERO" + hero);
                        }

                        final String ingameHeroId = mergeHero.getId();
                        final List<Item> itemsEquippedByIngameHeroId = itemsByIngameEquippedId
                                .getOrDefault(ingameHeroId, ImmutableList.of());

                        heroesRequestHandler.equipItemsOnHero(EquipItemsOnHeroRequest.builder()
                                .heroId(hero.getId())
                                .itemIds(itemsEquippedByIngameHeroId
                                        .stream()
                                        .map(Item::getId)
                                        .collect(Collectors.toList()))
                                .useReforgeStats(true)
                                .build());
                    });
        }

        return "";
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

    public String setItemsWithHeroes(final ItemsRequest request) {
        final List<Hero> allHeroes = heroDb.getAllHeroes();
        final List<Item> newItems = request.getItems();
        final Map<String, Hero> heroesByName = new HashMap<>();

        allHeroes.forEach(x -> heroesByName.putIfAbsent(x.getName(), x));

        for (final Item item : newItems) {
            if (StringUtils.isBlank(item.getHeroName())) {
                continue;
            }

            if (heroesByName.containsKey(item.getHeroName())) {
                final Hero hero = heroesByName.get(item.getHeroName());
                itemDb.equipItemOnHero(item.getId(), hero.getId());
            }
        }

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
            dbItem.setAugmentedStats(item.getAugmentedStats());
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
            item.setLocked(true);
        }

        return "";
    }

    public String unlockItems(final IdsRequest request) {
        logger.info(String.valueOf(request));
        final List<Item> items = itemDb.getItemsById(request.getIds());
        for (final Item item : items) {
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
        final List<Item> items = itemDb.getAllItems();
        augmentItemData(items);
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
                .filter(x -> StringUtils.equals(x.getIngameId(), request.getId()))
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

    private void augmentItemData(final List<Item> items) {
        final Map<Integer, List<Item>> itemsByHash = new HashMap<>();

        // Note down matching items
        for (final Item item : items) {
            item.setDuplicateId("");
            final int hash = item.getHash();

            if (itemsByHash.containsKey(hash)) {
                final List<Item> matchingItems = itemsByHash.get(hash);
                matchingItems.add(item);
            } else {
                itemsByHash.put(hash, new ArrayList<>(Collections.singletonList(item)));
            }
        }

        itemsByHash.entrySet().forEach(x -> {
            if (x.getValue().size() > 1) {
                x.getValue().forEach(y -> y.setDuplicateId("DUPLICATE" + x.getKey()));
            }
        });
    }
}
