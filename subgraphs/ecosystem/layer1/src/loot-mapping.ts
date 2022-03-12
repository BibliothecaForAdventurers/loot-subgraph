import { Transfer as TransferEvent } from '../generated/Loot/Loot';
import { getTransfer, getWallets, isZeroAddress } from './utils';

import { Bag } from '../generated/schema';
import { Loot } from '../generated/Loot/Loot';
import { BigInt } from '@graphprotocol/graph-ts';
import { getBagGreatness, getBagLevel, getBagRating } from './glr-utils';

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.bagsHeld = wallets.fromWallet.bagsHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.bagsHeld = wallets.toWallet.bagsHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()

  let suffixArray: Array<string> = ["","Power","Giants",
    "Titans","Skill","Perfection",
    "Brilliance","Enlightenment","Protection",
    "Anger","Rage","Fury","Vitriol",
    "the Fox","Detection","Reflection",
    "the Twins"];

  let bag = Bag.load(tokenId.toString());
  if (bag != null) {
    bag.currentOwner = wallets.toWallet.id;
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
    bag.currentOwner = wallets.toWallet.id;
    bag.minted = event.block.timestamp;
    bag.manasClaimed = BigInt.fromI32(0);
    
    const items = [bag.weapon, bag.chest, bag.head, bag.waist, bag.foot, bag.hand, bag.neck, bag.ring];
    bag.bagGreatness = getBagGreatness(tokenId);
    bag.bagLevel = getBagLevel(tokenId, items);
    bag.bagRating = getBagRating(tokenId, items);

    bag.save();
  }
  
  let transfer = getTransfer(event, wallets)
  transfer.bag = tokenId.toString();
  transfer.save()
}




