import { TransferSingle as TransferSingleEvent, TransferBatch as TransferBatchEvent } from '../generated/LootMart/MartItem';
import { getTransfer, getWallets, isZeroAddress } from './utils';

import { Item } from '../generated/schema';
import { MartItem } from '../generated/LootMart/MartItem';
import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransferSingle(event: TransferSingleEvent): void {
  let tokenId = event.params.id;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.itemsHeld = wallets.fromWallet.itemsHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.itemsHeld = wallets.toWallet.itemsHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()
  
  let martItem = Item.load(tokenId.toString());
    if (martItem != null) {
      martItem.currentOwner = wallets.toWallet.id;
      martItem.save();
    } else {
      martItem = new Item(tokenId.toString());
      let contract = MartItem.bind(event.address);  
      martItem.itemName = contract.nameFor(tokenId);
      martItem.itemType = contract.itemTypeFor(tokenId)
      martItem.currentOwner = wallets.toWallet.id;
      martItem.save();
    }

  
    let transfer = getTransfer(event, wallets)  
    transfer.item = [tokenId.toString()];
    transfer.save()
  
  }

  export function handleTransferBatch(event: TransferBatchEvent): void {
    let ids = event.params.ids;
    let wallets = getWallets(event.params.from, event.params.to, event);
  
    if(!isZeroAddress(wallets.fromWallet.id)) {
      wallets.fromWallet.itemsHeld = wallets.fromWallet.itemsHeld.minus(BigInt.fromI32(1))
    }
    wallets.fromWallet.save()
  
    wallets.toWallet.itemsHeld = wallets.toWallet.itemsHeld.plus(BigInt.fromI32(1))
    wallets.toWallet.save()

    for (var i = 0; i < ids.length; i++) {
      let tokenId = ids[i]
      let martItem = Item.load(tokenId.toString());
      if (martItem != null) {
        martItem.currentOwner = wallets.toWallet.id;
        martItem.save();
      } else {
        martItem = new Item(tokenId.toString());
        let contract = MartItem.bind(event.address);  
        martItem.itemName = contract.nameFor(tokenId);
        martItem.itemType = contract.itemTypeFor(tokenId)
        martItem.currentOwner = wallets.toWallet.id;
        martItem.save();
      }
  
      let transfer = getTransfer(event, wallets)  
      transfer.item = ids.map((i) => String(i));;
      transfer.save()
    
    }

  }

