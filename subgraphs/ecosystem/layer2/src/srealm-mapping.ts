import { SRealmL2, Transfer as TransferEvent } from '../generated/SRealms/SRealmL2';
import { getTransfer, getWallets, isZeroAddress } from './utils';

import { SRealm } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';


export function handleTransfer(event: TransferEvent): void {

  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);
  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.srealmsHeld = wallets.fromWallet.srealmsHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.srealmsHeld = wallets.toWallet.srealmsHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()
  let srealm = SRealm.load(tokenId.toString());

  if (srealm != null) {
    srealm.currentOwner = wallets.toWallet.id;
    srealm.save();
  } else {
    srealm = new SRealm(tokenId.toString());
    srealm.currentOwner = wallets.toWallet.id;
    srealm.minted = event.block.timestamp;
    srealm.save();
  }

  let transfer = getTransfer(event, wallets)  
  transfer.srealm = tokenId.toString();
  transfer.save()

}