import { BigInt, ByteArray, crypto } from "@graphprotocol/graph-ts";
import { GAdventurer } from "../generated/schema";

const ITEMS = [
  // WEAPONS
  [
    // Warrior
    "Warhammer",
    "Quarterstaff",
    "Maul",
    "Mace",
    "Club",

    // Hunter
    "Katana",
    "Falchion",
    "Scimitar",
    "Long Sword",
    "Short Sword",

    // Mage
    "Ghost Wand",
    "Grave Wand",
    "Bone Wand",
    "Wand",
    "",

    // Mage
    "Grimoire",
    "Chronicle",
    "Tome",
    "Book"
  ],

  // CHEST
  [
    // Warrior
    "Holy Chestplate",
    "Ornate Chestplate",
    "Plate Mail",
    "Chain Mail",
    "Ring Mail",

    // Hunter
    "Demon Husk",
    "Dragonskin Armor",
    "Studded Leather Armor",
    "Hard Leather Armor",
    "Leather Armor",

    // Mage
    "Divine Robe",
    "Silk Robe",
    "Linen Robe",
    "Robe",
    "Shirt"
  ],

  //HEAD
  [
    // Warrior
    "Ancient Helm",
    "Ornate Helm",
    "Great Helm",
    "Full Helm",
    "Helm",

    // Hunter
    "Demon Crown",
    "Dragon's Crown",
    "War Cap",
    "Leather Cap",
    "Cap",

    // Mage
    "Crown",
    "Divine Hood",
    "Silk Hood",
    "Linen Hood",
    "Hood"
  ],

  // WAIST
  [
    // Warrior
    "Ornate Belt",
    "War Belt",
    "Plated Belt",
    "Mesh Belt",
    "Heavy Belt",

    // Hunter
    "Demonhide Belt",
    "Dragonskin Belt",
    "Studded Leather Belt",
    "Hard Leather Belt",
    "Leather Belt",

    // Mage
    "Brightsilk Sash",
    "Silk Sash",
    "Wool Sash",
    "Linen Sash",
    "Sash"
  ],

  // FOOT
  [
    // Warrior
    "Holy Greaves",
    "Ornate Greaves",
    "Greaves",
    "Chain Boots",
    "Heavy Boots",

    // Hunter
    "Demonhide Boots",
    "Dragonskin Boots",
    "Studded Leather Boots",
    "Hard Leather Boots",
    "Leather Boots",

    // Mage
    "Divine Slippers",
    "Silk Slippers",
    "Wool Shoes",
    "Linen Shoes",
    "Shoes"
  ],

  // HAND
  [
    // Warrior
    "Holy Gauntlets",
    "Ornate Gauntlets",
    "Gauntlets",
    "Chain Gloves",
    "Heavy Gloves",

    // Hunter
    "Demon's Hands",
    "Dragonskin Gloves",
    "Studded Leather Gloves",
    "Hard Leather Gloves",
    "Leather Gloves",

    // Mage
    "Divine Gloves",
    "Silk Gloves",
    "Wool Gloves",
    "Linen Gloves",
    "Gloves"
  ],

  // NECK
  ["Necklace", "Amulet", "Pendant"],

  //RING
  ["Gold Ring", "Silver Ring", "Bronze Ring", "Platinum Ring", "Titanium Ring"]
];

const CLASSES = ["Warrior", "Hunter", "Mage", "Mage"];

const ITEMS_PREFIXES = [
  "WEAPON",
  "CHEST",
  "HEAD",
  "WAIST",
  "FOOT",
  "HAND",
  "NECK",
  "RING"
];

function getGreatnessByType(tokenId: string, keyPrefix: string): i32 {
  const rand = random(keyPrefix + tokenId);
  const greatness = rand.mod(BigInt.fromI32(21));
  return greatness.toI32();
}

export function random(input: string): BigInt {
  return BigInt.fromUnsignedBytes(
    changetype<ByteArray>(crypto.keccak256(ByteArray.fromUTF8(input)).reverse())
  );
}

const enum ItemType {
  WEAPON = 0,
  CHEST = 1,
  HEAD = 2,
  WAIST = 3,
  FOOT = 4,
  HAND = 5,
  NECK = 6,
  RING = 7
}

function findItemIndex(itemType: ItemType, itemName: string): i32 {
  let items = ITEMS[itemType];
  for (let i = 0; i < items.length; i++) {
    const foundItem =
      items[i] != "" &&
      itemName.toLowerCase().indexOf(items[i].toLowerCase()) > -1;
    if (foundItem) {
      return i;
    }
  }
  return -1;
}

export function getItemClass(itemType: ItemType, itemName: string): string {
  if (itemType > ItemType.HAND) {
    return "";
  }

  let itemIndex = findItemIndex(itemType, itemName);
  if (itemIndex < 0) {
    return "";
  }
  return CLASSES[Math.floor(itemIndex / 5) as i32] || "";
}

function getRingLevel(itemName: string): i32 {
  if (itemName.toLowerCase().indexOf("bronze") > -1) {
    return 3;
  } else if (itemName.toLowerCase().indexOf("silver") > -1) {
    return 2;
  } else {
    return 1;
  }
}

function getItemRank(itemType: ItemType, itemName: string): i32 {
  if (itemType === ItemType.NECK) {
    return 1;
  } else if (itemType === ItemType.RING) {
    return getRingLevel(itemName);
  }

  let itemIndex = findItemIndex(itemType, itemName);
  if (itemIndex < 0) {
    // Default Rank. Currently Catch All for Lost Mana
    return 5;
  }
  return (itemIndex % 5) + 1;
}

export function getItemLevel(
  lootId: BigInt,
  itemType: ItemType,
  itemName: string
): i32 {
  if (lootId.equals(BigInt.fromI32(0))) {
    return 1;
  }
  const rank = getItemRank(itemType, itemName);
  if (rank === 0) {
    // Default Power/Level 1
    return 1;
  }
  if (itemType > ItemType.HAND) {
    return 4 - rank;
  } else {
    return 6 - rank;
  }
}

export function getGreatnessByItem(
  lootTokenId: BigInt,
  itemType: ItemType
): i32 {
  return getGreatnessByType(lootTokenId.toString(), ITEMS_PREFIXES[itemType]);
}

export function getBagGreatness(tokenId: BigInt): i32 {
  let greatness = 0;
  for (let i = 0; i < 8; i++) {
    greatness += getGreatnessByItem(tokenId, i);
  }
  return greatness;
}

export function getGAdventurerGreatness(bag: GAdventurer): i32 {
  let lootTokenIds = bag.lootTokenIds;
  if (lootTokenIds == null) {
    return 0;
  }
  let greatness = 0;
  for (let i = 0; i < lootTokenIds.length; i++) {
    // GM minimum greatness is 15
    // Lost Mana defaults to 15
    greatness += Math.max(
      getGreatnessByItem(BigInt.fromI32(lootTokenIds[i]), i),
      15
    ) as i32;
  }
  return greatness;
}

export function getBagLevel(tokenId: BigInt, items: string[]): i32 {
  let level = 0;

  for (let i = 0; i < 8; i++) {
    level += getItemLevel(tokenId, i, items[i]);
  }
  return level;
}

export function getGAdventurerLevel(bag: GAdventurer): i32 {
  let level = 0;
  const lootIds = (bag.lootTokenIds as i32[]).map(function(
    lootId: i32,
    index: i32,
    array: i32[]
  ): BigInt {
    return BigInt.fromI32(lootId);
  });
  level += getItemLevel(lootIds[0], 0, bag.weapon);
  level += getItemLevel(lootIds[1], 1, bag.chest);
  level += getItemLevel(lootIds[2], 2, bag.head);
  level += getItemLevel(lootIds[3], 3, bag.waist);
  level += getItemLevel(lootIds[4], 4, bag.foot);
  level += getItemLevel(lootIds[5], 5, bag.hand);
  level += getItemLevel(lootIds[6], 6, bag.neck);
  level += getItemLevel(lootIds[7], 7, bag.ring);
  return level;
}

export function getBagRating(tokenId: BigInt, items: string[]): i32 {
  let rating = 0;
  for (let i = 0; i < 8; i++) {
    rating +=
      getItemLevel(tokenId, i, items[i]) * getGreatnessByItem(tokenId, i);
  }
  return rating;
}

export function getGAdventurerRating(bag: GAdventurer): i32 {
  let tokenIds: BigInt[] = [];
  if (bag.lootTokenIds != null) {
    tokenIds = (bag.lootTokenIds as i32[]).map(function(
      lootId: i32,
      index: i32,
      array: i32[]
    ): BigInt {
      return BigInt.fromI32(lootId);
    });
  }

  let rating = 0;
  rating += (getItemLevel(tokenIds[0], 0, bag.weapon) *
    Math.max(getGreatnessByItem(tokenIds[0], 0), 15)) as i32;
  rating += (getItemLevel(tokenIds[1], 1, bag.chest) *
    Math.max(getGreatnessByItem(tokenIds[1], 1), 15)) as i32;
  rating += (getItemLevel(tokenIds[2], 2, bag.head) *
    Math.max(getGreatnessByItem(tokenIds[2], 2), 15)) as i32;
  rating += (getItemLevel(tokenIds[3], 3, bag.waist) *
    Math.max(getGreatnessByItem(tokenIds[3], 3), 15)) as i32;
  rating += (getItemLevel(tokenIds[4], 4, bag.foot) *
    Math.max(getGreatnessByItem(tokenIds[4], 4), 15)) as i32;
  rating += (getItemLevel(tokenIds[5], 5, bag.hand) *
    Math.max(getGreatnessByItem(tokenIds[5], 5), 15)) as i32;
  rating += (getItemLevel(tokenIds[6], 6, bag.neck) *
    Math.max(getGreatnessByItem(tokenIds[6], 6), 15)) as i32;
  rating += (getItemLevel(tokenIds[7], 7, bag.ring) *
    Math.max(getGreatnessByItem(tokenIds[7], 7), 15)) as i32;
  return rating;
}
