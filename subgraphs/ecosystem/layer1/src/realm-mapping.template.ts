import { Transfer as TransferEvent } from '../generated/LootRealm/LootRealm';

import { isZeroAddress, getWallets, getTransfer } from './utils';
import { rarityArray } from './realm-rarity';
import { Realm } from '../generated/schema';
import { LootRealm } from '../generated/LootRealm/LootRealm';

import { Address, log, BigDecimal, BigInt } from '@graphprotocol/graph-ts';

const journeyAddress = "{{ journey.address }}"

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.realmsHeld = wallets.fromWallet.realmsHeld.minus(BigInt.fromI32(1))

  }

  wallets.toWallet.realmsHeld = wallets.toWallet.realmsHeld.plus(BigInt.fromI32(1));

  let realm = Realm.load(tokenId.toString());

  if (realm != null) {
    log.error('realm not null {}', [tokenId.toString()])
    realm.currentOwner = wallets.toWallet.id;
    if(event.params.from.toHexString() == journeyAddress) {
      wallets.toWallet.bridgedRealmsHeld = wallets.toWallet.bridgedRealmsHeld.minus(BigInt.fromI32(1))
      realm.bridgedOwner = null
    }
    if(event.params.to.toHexString() == journeyAddress) {
      log.error('journey address to {}', [realm.id])
      wallets.fromWallet.bridgedRealmsHeld = wallets.fromWallet.bridgedRealmsHeld.plus(BigInt.fromI32(1))
      realm.bridgedOwner = wallets.fromWallet.id
    }
  } else {
    realm = new Realm(tokenId.toString());
    let contract = LootRealm.bind(event.address);
    let tokenrarityScore = rarityArray[tokenId.toI32()][0]
    let score = BigDecimal.fromString(tokenrarityScore.toString())
    let tokenrarityRank = rarityArray[tokenId.toI32()][1]
    let rank = BigDecimal.fromString(tokenrarityRank.toString())
    realm.tokenURI = contract.tokenURI(tokenId);
    realm.rarityScore = score;
    realm.rarityRank = rank;
    realm.currentOwner = wallets.toWallet.id;
    realm.minted = event.block.timestamp;
    realm.bridgedOwner = null
  }
  wallets.fromWallet.save()
  wallets.toWallet.save()
  realm.save();

  let transfer = getTransfer(event, wallets)  
  transfer.realm = tokenId.toString();


  transfer.save();


  }
  