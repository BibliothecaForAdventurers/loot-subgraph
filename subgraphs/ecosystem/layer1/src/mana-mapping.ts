import { Transfer as TransferEvent } from '../generated/GenesisProjectMana/GenesisMana';
import { getTransfer, getWallets, isZeroAddress } from './utils';

import { Bag, Mana } from '../generated/schema';
import { GenesisMana } from '../generated/GenesisProjectMana/GenesisMana';
import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.manasHeld = wallets.fromWallet.manasHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.manasHeld = wallets.toWallet.manasHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()
  
  let lootTokenId = "";
  let mana = Mana.load(tokenId.toString());
    if (mana != null) {
      mana.currentOwner = wallets.toWallet.id;
      mana.save();
    } else {
      mana = new Mana(tokenId.toString());
      let contract = GenesisMana.bind(event.address);
      let manaDetails = contract.detailsByToken(tokenId);
      lootTokenId =  manaDetails.value0.toString();
  
      mana.lootTokenId = lootTokenId
      mana.itemName = manaDetails.value1;
      mana.suffixId = manaDetails.value2;
      mana.inventoryId = manaDetails.value3;
      mana.currentOwner = wallets.toWallet.id;
      mana.minted = event.block.timestamp;
      mana.save();
    }
    let bag = Bag.load(lootTokenId);
    if (bag != null) {
      if (bag.manasClaimed)
        bag.manasClaimed = bag.manasClaimed.plus(BigInt.fromI32(1));
      bag.save();
    }
  
    let transfer = getTransfer(event, wallets)  
    transfer.mana = tokenId.toString();
    transfer.save()
  
  }