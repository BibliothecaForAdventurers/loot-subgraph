import { Transfer as RealmTransferEvent } from '../generated/LootRealm/LootRealmL2';
import { getTransfer, getWallets, isZeroAddress } from './utils';

import { Realm } from '../generated/schema';

import { LootRealmL2 } from '../generated/LootRealm/LootRealmL2';

import { BigInt } from '@graphprotocol/graph-ts';


export function handleRealmTransfer(event: RealmTransferEvent): void {

  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.realmsHeld = wallets.fromWallet.realmsHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.realmsHeld = wallets.toWallet.realmsHeld.plus(BigInt.fromI32(1))
  wallets.toWallet.save()

  let realm = Realm.load(tokenId.toString());
  if (realm != null) {
    realm.currentOwner = wallets.toWallet.id;
    realm.save();
  } else {
    realm = new Realm(tokenId.toString());
    let contract = LootRealmL2.bind(event.address);
    realm.tokenURI = contract.tokenURI(tokenId);
    realm.currentOwner = wallets.toWallet.id;
    realm.minted = event.block.timestamp;
    realm.save();
  }

  let transfer = getTransfer(event, wallets)  
  transfer.realm = tokenId.toString();
  transfer.save()

}