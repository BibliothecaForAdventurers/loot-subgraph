import { Transfer as RealmTransferEvent } from '../generated/LootRealm/LootRealmL2';
import { getTransfer, initWallet, isZeroAddress } from './utils';

import { Realm } from '../generated/schema';

import { LootRealmL2 } from '../generated/LootRealm/LootRealmL2';

import { BigInt } from '@graphprotocol/graph-ts';


export function handleRealmTransfer(event: RealmTransferEvent): void {

  let tokenId = event.params.tokenId;

  let fromWallet = initWallet(event.params.from, event);
  let toWallet = initWallet(event.params.to, event);

  if(!isZeroAddress(fromWallet.id)) {
    fromWallet.realmsHeld = fromWallet.realmsHeld.minus(BigInt.fromI32(1))
  }
  fromWallet.save()

  toWallet.realmsHeld = toWallet.realmsHeld.plus(BigInt.fromI32(1))
  toWallet.save()

  let realm = Realm.load(tokenId.toString());
  if (realm != null) {
    realm.currentOwner = toWallet.id;
    realm.save();
  } else {
    realm = new Realm(tokenId.toString());
    let contract = LootRealmL2.bind(event.address);
    realm.tokenURI = contract.tokenURI(tokenId);
    realm.currentOwner = toWallet.id;
    realm.minted = event.block.timestamp;
    realm.save();
  }

  let transfer = getTransfer(event, {fromWallet, toWallet})  
  transfer.realm = tokenId.toString();
  transfer.save()

}