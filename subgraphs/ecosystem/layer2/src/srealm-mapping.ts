import { SRealmL2, Transfer as TransferEvent } from '../generated/SRealms/SRealmL2';
import { getTransfer, initWallet, isZeroAddress } from './utils';

import { SRealm, Resource } from '../generated/schema';
import { BigInt, BigDecimal } from '@graphprotocol/graph-ts';


export function handleTransfer(event: TransferEvent): void {

  let tokenId = event.params.tokenId;

  let fromWallet = initWallet(event.params.from, event);
  let toWallet = initWallet(event.params.to, event);

  if (!isZeroAddress(fromWallet.id)) {
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
    srealm.resourceIds = []
    srealm.rarityScore = new BigDecimal(BigInt.fromI32(0))
    srealm.raidAttacks = BigInt.fromI32(0)
    srealm.raidDefends = BigInt.fromI32(0)
    srealm.save();
  }

  if (!isZeroAddress(toWallet.id)) {
    for (let i = 0; i < srealm.resourceIds.length; i++) {
      let resource = Resource.load(srealm.resourceIds[i].toString());
      if (resource) {
        resource.stakedRealms = resource.stakedRealms.minus(BigInt.fromI32(1))
      }
    }
  }

  let transfer = getTransfer(event, { fromWallet, toWallet })
  transfer.srealm = tokenId.toString();
  transfer.save()

}