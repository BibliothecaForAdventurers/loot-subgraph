import { Transfer as RealmTransferEvent } from '../generated/LootRealm/LootRealm';

import { Bag, MLoot, Transfer, Wallet, Realm, Treasure } from '../generated/schema';

import { LootRealm } from '../generated/LootRealm/LootRealm';

import { BigInt } from '@graphprotocol/graph-ts';


export function handleRealmTransfer(event: RealmTransferEvent): void {
  let fromAddress = event.params.from;
  let toAddress = event.params.to;
  let tokenId = event.params.tokenId;
  let fromId = fromAddress.toHex();
  let fromWallet = Wallet.load(fromId);

  if (!fromWallet) {
    fromWallet = new Wallet(fromId);
    fromWallet.address = fromAddress;
    fromWallet.joined = event.block.timestamp;
    fromWallet.realmsHeld = BigInt.fromI32(0);
    fromWallet.save();
  } else {
    if (!isZeroAddress(fromId)) {
      fromWallet.realmsHeld = fromWallet.realmsHeld.minus(BigInt.fromI32(1));
      fromWallet.save();
    }
  }

  let toId = toAddress.toHex();
  let toWallet = Wallet.load(toId);
  if (!toWallet) {
    toWallet = new Wallet(toId);
    toWallet.address = toAddress;
    toWallet.joined = event.block.timestamp;
    toWallet.realmsHeld = BigInt.fromI32(1);
    toWallet.save();
  } else {
    toWallet.realmsHeld = toWallet.realmsHeld.plus(BigInt.fromI32(1));
    toWallet.save();
  }

  let realm = Realm.load(tokenId.toString());
  if (realm != null) {
    realm.currentOwner = toWallet.id;
    realm.save();
  } else {
    realm = new Realm(tokenId.toString());
    let contract = LootRealm.bind(event.address);
    realm.tokenURI = contract.tokenURI(tokenId);
    realm.currentOwner = toWallet.id;
    realm.minted = event.block.timestamp;
    realm.save();
  }

  let transfer = new Transfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  );

  transfer.realm = tokenId.toString();
  transfer.from = fromWallet.id;
  transfer.to = toWallet.id;
  transfer.txHash = event.transaction.hash;
  transfer.timestamp = event.block.timestamp;
  transfer.save();
}

function isZeroAddress(string: string): boolean {
  return string == '0x0000000000000000000000000000000000000000';
}

