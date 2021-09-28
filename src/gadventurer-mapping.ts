import { GAdventurer, Transfer, Wallet} from '../generated/schema';
import { Transfer as TransferEvent } from '../generated/LootMore/LootMore';
import { GenesisAdventurer } from '../generated/GenesisProjectAdventurer/GenesisAdventurer';
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
      fromWallet.gAdventurersHeld = BigInt.fromI32(0);
      fromWallet.save();
    } else {
      if (!isZeroAddress(fromId)) {
        fromWallet.gAdventurersHeld = fromWallet.gAdventurersHeld.minus(BigInt.fromI32(1));
        fromWallet.save();
      }
    }
  
    let toId = toAddress.toHex();
    let toWallet = Wallet.load(toId);
    if (!toWallet) {
      toWallet = new Wallet(toId);
      toWallet.address = toAddress;
      toWallet.joined = event.block.timestamp;
      toWallet.gAdventurersHeld = BigInt.fromI32(1);
      toWallet.save();
    } else {
      toWallet.gAdventurersHeld = toWallet.gAdventurersHeld.plus(BigInt.fromI32(1));
      toWallet.save();
    }
  
    let gAdventurer = GAdventurer.load(tokenId.toString());
    if (gAdventurer != null) {
      gAdventurer.currentOwner = toWallet.id;
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
      gAdventurer.currentOwner = toWallet.id;
      gAdventurer.minted = event.block.timestamp;
      gAdventurer.save();
    }
  
    let transfer = new Transfer(
      event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    );
  
    transfer.gAdventurer = tokenId.toString();
    transfer.from = fromWallet.id;
    transfer.to = toWallet.id;
    transfer.txHash = event.transaction.hash;
    transfer.timestamp = event.block.timestamp;
    transfer.save();
  }