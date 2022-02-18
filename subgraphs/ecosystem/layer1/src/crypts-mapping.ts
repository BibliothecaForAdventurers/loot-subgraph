
import { Dungeon } from '../generated/schema';
import { Transfer as TransferEvent } from '../generated/CryptsAndCaverns/Dungeons';
import { Dungeons } from '../generated/CryptsAndCaverns/Dungeons';
import { getTransfer, getWallets, isZeroAddress } from './utils';

import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
    let wallets = getWallets(event.params.from, event.params.to, event);


  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.dungeonsHeld = wallets.fromWallet.dungeonsHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.dungeonsHeld = wallets.toWallet.dungeonsHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()

  let dungeon = Dungeon.load(tokenId.toString());
    if (dungeon != null) {
      dungeon.currentOwner = wallets.toWallet.id;
      dungeon.save();
    } else {
      dungeon = new Dungeon(tokenId.toString());
      let contract = Dungeons.bind(event.address);
      dungeon.size = contract.getSize(tokenId);
      dungeon.layout = contract.getLayout(tokenId);
      dungeon.environment = contract.getEnvironment(tokenId);
      dungeon.numDoors = contract.getNumDoors(tokenId);
      dungeon.numPoints = contract.getNumPoints(tokenId);
      dungeon.name = contract.getName(tokenId);
      dungeon.svg = contract.getSvg(tokenId);
      dungeon.currentOwner = wallets.toWallet.id;
      dungeon.minted = event.block.timestamp;
      dungeon.save(); 
    }
  
    let transfer = getTransfer(event, wallets)  
    transfer.dungeon = tokenId.toString();
    transfer.save();
  }