import { Transfer as TransferEvent } from '../generated/LootTreasure/LootTreasure';

import { getTransfer, getWallets, isZeroAddress } from './utils';

import { Treasure } from '../generated/schema';
import { LootTreasure } from '../generated/LootTreasure/LootTreasure';

import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);


  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.treasuresHeld = wallets.fromWallet.treasuresHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.treasuresHeld = wallets.toWallet.treasuresHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()
    
  let treasure = Treasure.load(tokenId.toString());
    if (treasure != null) {
      treasure.currentOwner = wallets.toWallet.id;
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
      treasure.currentOwner = wallets.toWallet.id;
      treasure.minted = event.block.timestamp;
      treasure.save();
    }
  
    let transfer = getTransfer(event, wallets)  
    transfer.treasure = tokenId.toString();
    transfer.save();
  }
  