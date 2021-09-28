import { Transfer as TransferEvent } from '../generated/LootTreasure/LootTreasure';

import { isZeroAddress } from './utils';

import { Transfer, Wallet, Treasure } from '../generated/schema';
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
  