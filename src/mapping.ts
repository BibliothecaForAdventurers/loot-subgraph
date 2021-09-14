import { Transfer as TransferEvent } from '../generated/Loot/Loot';
import { Transfer as RealmTransferEvent } from '../generated/LootRealm/LootRealm';
import { Transfer as TreasureTransferEvent } from '../generated/LootTreasure/LootTreasure';

import { Bag, MLoot, Transfer, Wallet, Realm, Treasure } from '../generated/schema';
import { Loot } from '../generated/Loot/Loot';
import { LootMore } from '../generated/LootMore/LootMore';
import { LootRealm } from '../generated/LootRealm/LootRealm';
import { LootTreasure } from '../generated/LootTreasure/LootTreasure';

import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;
  let tokenId = event.params.tokenId;
  let fromId = fromAddress.toHex();
  let fromWallet = Wallet.load(fromId);

  if (!fromWallet) {
    fromWallet = new Wallet(fromId);
    fromWallet.address = fromAddress;
    fromWallet.joined = event.block.timestamp;
    fromWallet.bagsHeld = BigInt.fromI32(0);
    fromWallet.save();
  } else {
    if (!isZeroAddress(fromId)) {
      fromWallet.bagsHeld = fromWallet.bagsHeld.minus(BigInt.fromI32(1));
      fromWallet.save();
    }
  }

  let toId = toAddress.toHex();
  let toWallet = Wallet.load(toId);
  if (!toWallet) {
    toWallet = new Wallet(toId);
    toWallet.address = toAddress;
    toWallet.joined = event.block.timestamp;
    toWallet.bagsHeld = BigInt.fromI32(1);
    toWallet.save();
  } else {
    toWallet.bagsHeld = toWallet.bagsHeld.plus(BigInt.fromI32(1));
    toWallet.save();
  }

  let bag = Bag.load(tokenId.toString());
  if (bag != null) {
    bag.currentOwner = toWallet.id;
    bag.save();
  } else {
    bag = new Bag(tokenId.toString());
    let contract = Loot.bind(event.address);
    bag.chest = contract.getChest(tokenId);
    bag.foot = contract.getFoot(tokenId);
    bag.hand = contract.getHand(tokenId);
    bag.head = contract.getHead(tokenId);
    bag.neck = contract.getNeck(tokenId);
    bag.ring = contract.getRing(tokenId);
    bag.waist = contract.getWaist(tokenId);
    bag.weapon = contract.getWeapon(tokenId);
    bag.currentOwner = toWallet.id;
    bag.minted = event.block.timestamp;
    bag.save();
  }

  let transfer = new Transfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  transfer.bag = tokenId.toString();
  transfer.from = fromWallet.id;
  transfer.to = toWallet.id;
  transfer.txHash = event.transaction.hash;
  transfer.timestamp = event.block.timestamp;
  transfer.save();
}
export function handleMLootTransfer(event: TransferEvent): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;
  let tokenId = event.params.tokenId;
  let fromId = fromAddress.toHex();
  let fromWallet = Wallet.load(fromId);

  if (!fromWallet) {
    fromWallet = new Wallet(fromId);
    fromWallet.address = fromAddress;
    fromWallet.joined = event.block.timestamp;
    fromWallet.mLootHeld = BigInt.fromI32(0);
    fromWallet.save();
  } else {
    if (!isZeroAddress(fromId)) {
      fromWallet.mLootHeld = fromWallet.mLootHeld.minus(BigInt.fromI32(1));
      fromWallet.save();
    }
  }

  let toId = toAddress.toHex();
  let toWallet = Wallet.load(toId);
  if (!toWallet) {
    toWallet = new Wallet(toId);
    toWallet.address = toAddress;
    toWallet.joined = event.block.timestamp;
    toWallet.mLootHeld = BigInt.fromI32(1);
    toWallet.save();
  } else {
    toWallet.mLootHeld = toWallet.mLootHeld.plus(BigInt.fromI32(1));
    toWallet.save();
  }

  let mLoot = MLoot.load(tokenId.toString());
  if (mLoot != null) {
    mLoot.currentOwner = toWallet.id;
    mLoot.save();
  } else {
    mLoot = new MLoot(tokenId.toString());
    let contract = LootMore.bind(event.address);
    mLoot.chest = contract.getChest(tokenId);
    mLoot.foot = contract.getFoot(tokenId);
    mLoot.hand = contract.getHand(tokenId);
    mLoot.head = contract.getHead(tokenId);
    mLoot.neck = contract.getNeck(tokenId);
    mLoot.ring = contract.getRing(tokenId);
    mLoot.waist = contract.getWaist(tokenId);
    mLoot.weapon = contract.getWeapon(tokenId);
    mLoot.currentOwner = toWallet.id;
    mLoot.minted = event.block.timestamp;
    mLoot.save();
  }

  let transfer = new Transfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  transfer.mLoot = tokenId.toString();
  transfer.from = fromWallet.id;
  transfer.to = toWallet.id;
  transfer.txHash = event.transaction.hash;
  transfer.timestamp = event.block.timestamp;
  transfer.save();
}

export function handleTreasureTransfer(event: TreasureTransferEvent): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;
  let tokenId = event.params.tokenId;
  let fromId = fromAddress.toHex();
  let fromWallet = Wallet.load(fromId);

  if (!fromWallet) {
    fromWallet = new Wallet(fromId);
    fromWallet.address = fromAddress;
    fromWallet.joined = event.block.timestamp;
    fromWallet.treasuresHeld = BigInt.fromI32(0);
    fromWallet.save();
  } else {
    if (!isZeroAddress(fromId)) {
      fromWallet.treasuresHeld = fromWallet.treasuresHeld.minus(BigInt.fromI32(1));
      fromWallet.save();
    }
  }

  let toId = toAddress.toHex();
  let toWallet = Wallet.load(toId);
  if (!toWallet) {
    toWallet = new Wallet(toId);
    toWallet.address = toAddress;
    toWallet.joined = event.block.timestamp;
    toWallet.treasuresHeld = BigInt.fromI32(1);
    toWallet.save();
  } else {
    toWallet.treasuresHeld = toWallet.treasuresHeld.plus(BigInt.fromI32(1));
    toWallet.save();
  }

  let treasure = Treasure.load(tokenId.toString());
  if (treasure != null) {
    treasure.currentOwner = toWallet.id;
    treasure.save();
  } else {
    treasure = new Treasure(tokenId.toString());
    let contract = LootTreasure.bind(event.address);
    treasure.asset1 = contract.getAsset1(tokenId);
    treasure.asset2 = contract.getAsset2(tokenId);
    treasure.asset3 = contract.getAsset3(tokenId);
    treasure.asset4 = contract.getAsset4(tokenId);
    treasure.asset5 = contract.getAsset5(tokenId);
    treasure.asset6 = contract.getAsset6(tokenId);
    treasure.asset7 = contract.getAsset7(tokenId);
    treasure.asset8 = contract.getAsset8(tokenId);
    treasure.currentOwner = toWallet.id;
    treasure.minted = event.block.timestamp;
    treasure.save();
  }

  let transfer = new Transfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  transfer.treasure = tokenId.toString();
  transfer.from = fromWallet.id;
  transfer.to = toWallet.id;
  transfer.txHash = event.transaction.hash;
  transfer.timestamp = event.block.timestamp;
  transfer.save();
}

export function handleRealmTransfer(event: RealmTransferEvent): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;
  let tokenId = event.params.tokenId;
  let fromId = fromAddress.toHex();
  let fromWallet = Wallet.load(fromId);

  if (!fromWallet) {
    fromWallet = new Wallet(fromId);
    fromWallet.address = fromAddress;
    fromWallet.joined = event.block.timestamp;
    fromWallet.realmsHeld = BigInt.fromI32(0);
    fromWallet.save();
  } else {
    if (!isZeroAddress(fromId)) {
      fromWallet.realmsHeld = fromWallet.realmsHeld.minus(BigInt.fromI32(1));
      fromWallet.save();
    }
  }

  let toId = toAddress.toHex();
  let toWallet = Wallet.load(toId);
  if (!toWallet) {
    toWallet = new Wallet(toId);
    toWallet.address = toAddress;
    toWallet.joined = event.block.timestamp;
    toWallet.realmsHeld = BigInt.fromI32(1);
    toWallet.save();
  } else {
    toWallet.realmsHeld = toWallet.realmsHeld.plus(BigInt.fromI32(1));
    toWallet.save();
  }

  let realm = Realm.load(tokenId.toString());
  if (realm != null) {
    realm.currentOwner = toWallet.id;
    realm.save();
  } else {
    realm = new Realm(tokenId.toString());
    let contract = LootRealm.bind(event.address);
    realm.tokenURI = contract.tokenURI(tokenId);
    realm.currentOwner = toWallet.id;
    realm.minted = event.block.timestamp;
    realm.save();
  }

  let transfer = new Transfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  transfer.realm = tokenId.toString();
  transfer.from = fromWallet.id;
  transfer.to = toWallet.id;
  transfer.txHash = event.transaction.hash;
  transfer.timestamp = event.block.timestamp;
  transfer.save();
}

function isZeroAddress(string: string): boolean {
  return string == '0x0000000000000000000000000000000000000000';
}

