import { Transfer as TransferEvent } from '../generated/LootRealm/LootRealm';

import { isZeroAddress, getWallets, getTransfer } from './utils';

import { Realm } from '../generated/schema';
import { LootRealm } from '../generated/LootRealm/LootRealm';

import { BigInt } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.realmsHeld = wallets.fromWallet.realmsHeld.minus(BigInt.fromI32(1))
  }
  wallets.fromWallet.save()

  wallets.toWallet.realmsHeld = wallets.toWallet.realmsHeld.plus(BigInt.fromI32(1));
  wallets.toWallet.save()

  let realm = Realm.load(tokenId.toString());
  if (realm != null) {
    realm.currentOwner = wallets.toWallet.id;
    realm.save();
  } else {
    realm = new Realm(tokenId.toString());
    let contract = LootRealm.bind(event.address);
    realm.tokenURI = contract.tokenURI(tokenId);
    realm.currentOwner = wallets.toWallet.id;
    realm.minted = event.block.timestamp;
    realm.save();
  }

  let transfer = getTransfer(event, wallets)  
  transfer.realm = tokenId.toString();
  transfer.save();

  }
  