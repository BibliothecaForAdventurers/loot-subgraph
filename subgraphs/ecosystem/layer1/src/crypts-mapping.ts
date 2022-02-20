
import { Dungeon } from '../generated/schema';
import { Transfer as TransferEvent } from '../generated/CryptsAndCaverns/Dungeons';
import { Dungeons } from '../generated/CryptsAndCaverns/Dungeons';
import { getTransfer, getWallets, isZeroAddress } from './utils';
import { log } from '@graphprotocol/graph-ts';

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
      dungeon.name = contract.getName(tokenId);

      let numDoorsResult = contract.try_getNumDoors(tokenId)
      if (numDoorsResult.reverted) {
        log.info('numDoors reverted', [])
      } else {
        dungeon.numDoors = numDoorsResult.value
      }

      let numPointsResult = contract.try_getNumPoints(tokenId)
      if (numPointsResult.reverted) {
        log.info('numPoints reverted', [])
      } else {
        dungeon.numPoints = numPointsResult.value
      }

      let svgResult = contract.try_getSvg(tokenId)
      if (svgResult.reverted) {
        log.info('Svg reverted', [])
      } else {
        dungeon.svg = svgResult.value
      }
      
      dungeon.currentOwner = wallets.toWallet.id;
      dungeon.minted = event.block.timestamp;
      dungeon.save(); 
    }
  
    let transfer = getTransfer(event, wallets)  
    transfer.dungeon = tokenId.toString();
    transfer.save();
  }