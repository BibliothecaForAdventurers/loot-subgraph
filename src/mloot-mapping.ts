import { MLoot, Transfer, Wallet} from '../generated/schema';
import { Transfer as TransferEvent } from '../generated/LootMore/LootMore';
import { LootMore } from '../generated/LootMore/LootMore';
import { isZeroAddress } from './utils';

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