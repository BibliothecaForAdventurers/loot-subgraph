import { GAdventurer } from '../generated/schema';
import { Transfer as TransferEvent } from '../generated/LootMore/LootMore';
import { GenesisAdventurer } from '../generated/GenesisProjectAdventurer/GenesisAdventurer';
import { getTransfer, getWallets, isZeroAddress } from './utils';

import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
    let wallets = getWallets(event.params.from, event.params.to, event);


  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.gAdventurersHeld = wallets.fromWallet.gAdventurersHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.gAdventurersHeld = wallets.toWallet.gAdventurersHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()

  let gAdventurer = GAdventurer.load(tokenId.toString());
    if (gAdventurer != null) {
      gAdventurer.currentOwner = wallets.toWallet.id;
      gAdventurer.save();
    } else {
      gAdventurer = new GAdventurer(tokenId.toString());
      let contract = GenesisAdventurer.bind(event.address);
      gAdventurer.chest = contract.getChest(tokenId);
      gAdventurer.foot = contract.getFoot(tokenId);
      gAdventurer.hand = contract.getHand(tokenId);
      gAdventurer.head = contract.getHead(tokenId);
      gAdventurer.neck = contract.getNeck(tokenId);
      gAdventurer.ring = contract.getRing(tokenId);
      gAdventurer.waist = contract.getWaist(tokenId);
      gAdventurer.weapon = contract.getWeapon(tokenId);
      gAdventurer.order = contract.getOrder(tokenId);
      gAdventurer.orderColor = contract.getOrderColor(tokenId);
      gAdventurer.orderCount = contract.getOrder(tokenId);
      gAdventurer.currentOwner = wallets.toWallet.id;
      gAdventurer.minted = event.block.timestamp;
      gAdventurer.save();
    }
  
    let transfer = getTransfer(event, wallets)  
    transfer.gAdventurer = tokenId.toString();
    transfer.save();
  }