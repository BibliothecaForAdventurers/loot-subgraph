import { SRealmL2, Transfer as TransferEvent } from '../generated/SRealms/SRealmL2';
import { getTransfer, initWallet, isZeroAddress } from './utils';

import { SRealm } from '../generated/schema';
import { BigInt, BigDecimal } from '@graphprotocol/graph-ts';


export function handleTransfer(event: TransferEvent): void {

  let tokenId = event.params.tokenId;

  let fromWallet = initWallet(event.params.from, event);
  let toWallet = initWallet(event.params.to, event);

  if(!isZeroAddress(fromWallet.id)) {
    fromWallet.srealmsHeld = fromWallet.srealmsHeld.minus(BigInt.fromI32(1))
  }
  fromWallet.save()

  toWallet.srealmsHeld = toWallet.srealmsHeld.plus(BigInt.fromI32(1))
  toWallet.save()
  let srealm = SRealm.load(tokenId.toString());

  if (srealm != null) {
    srealm.currentOwner = toWallet.id;
    srealm.save();
  } else {
    srealm = new SRealm(tokenId.toString());
    srealm.currentOwner = toWallet.id;
    srealm.minted = event.block.timestamp;
    srealm.save();
  }

  let transfer = getTransfer(event, {fromWallet, toWallet})  
  transfer.srealm = tokenId.toString();
  transfer.save()

}