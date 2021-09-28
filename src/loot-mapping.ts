import { Transfer as TransferEvent } from '../generated/Loot/Loot';
import { isZeroAddress } from './utils';

import { Bag, Transfer, Wallet } from '../generated/schema';
import { Loot } from '../generated/Loot/Loot';
import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;
  let tokenId = event.params.tokenId;
  let fromId = fromAddress.toHex();
  let fromWallet = Wallet.load(fromId);

  let suffixArray: Array<string> = ["","Power","Giants",
    "Titans","Skill","Perfection",
    "Brilliance","Enlightenment","Protection",
    "Anger","Rage","Fury","Vitriol",
    "the Fox","Detection","Reflection",
    "the Twins"];

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
    let item:string;
    item = contract.getChest(tokenId);
    bag.chest = item;
    if (item.includes("of ")) {
      bag.chestSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.chestSuffixId = 0;

    item = contract.getFoot(tokenId);
    bag.foot = item;
    if (item.includes("of ")) {
      bag.footSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.footSuffixId = 0;

    item = contract.getHand(tokenId);
    bag.hand = item;
    if (item.includes("of ")) {
      bag.handSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.handSuffixId = 0;

    item = contract.getHead(tokenId);
    bag.head = item;
    if (item.includes("of ")) {
      bag.headSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.headSuffixId = 0;

    item = contract.getNeck(tokenId);
    bag.neck = item;
    if (item.includes("of ")) {
      bag.neckSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.neckSuffixId = 0;

    item = contract.getRing(tokenId);
    bag.ring = item;
    if (item.includes("of ")) {
      bag.ringSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.ringSuffixId = 0;

    item = contract.getWaist(tokenId);
    bag.waist = item;
    if (item.includes("of ")) {
      bag.waistSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.waistSuffixId = 0;

    item = contract.getWeapon(tokenId);
    bag.weapon = item;
    if (item.includes("of ")) {
      bag.weaponSuffixId = suffixArray.indexOf(item.split("of ")[1].split(" +1")[0]);
    } else
      bag.weaponSuffixId = 0;
    bag.currentOwner = toWallet.id;
    bag.minted = event.block.timestamp;
    bag.manasClaimed = BigInt.fromI32(0);
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




