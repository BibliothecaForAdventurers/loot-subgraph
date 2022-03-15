import { MLoot } from "../generated/schema";
import { Transfer as TransferEvent } from "../generated/LootMore/LootMore";
import { LootMore } from "../generated/LootMore/LootMore";
import { getTransfer, getWallets, isZeroAddress } from "./utils";

import { BigInt } from "@graphprotocol/graph-ts";
import { getBagGreatness, getBagLevel, getBagRating } from "./glr-utils";

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if (!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.mLootsHeld = wallets.fromWallet.mLootsHeld.minus(
      BigInt.fromI32(1)
    );
  }
  wallets.fromWallet.save();

  wallets.toWallet.mLootsHeld = wallets.toWallet.mLootsHeld.plus(
    BigInt.fromI32(1)
  );
  wallets.toWallet.save();

  let mLoot = MLoot.load(tokenId.toString());
  if (mLoot != null) {
    mLoot.currentOwner = wallets.toWallet.id;
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
    const items = [
      mLoot.weapon,
      mLoot.chest,
      mLoot.head,
      mLoot.waist,
      mLoot.foot,
      mLoot.hand,
      mLoot.neck,
      mLoot.ring
    ];
    mLoot.bagGreatness = getBagGreatness(tokenId);
    mLoot.bagLevel = getBagLevel(tokenId, items);
    mLoot.bagRating = getBagRating(tokenId, items);
    mLoot.currentOwner = wallets.toWallet.id;
    mLoot.minted = event.block.timestamp;
    mLoot.save();
  }

  let transfer = getTransfer(event, wallets);
  transfer.mLoot = tokenId.toString();
  transfer.save();
}
