import { StakeRealms as StakeRealmsEvent, UnStakeRealms as UnStakeRealmsEvent } from '../generated/Journey/Journey';


import { Address, log, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { Wallet} from '../generated/schema';


export function handleStakeRealms(event: StakeRealmsEvent): void {
  let tokenIds = event.params.tokenIds;
  let player = event.params.player;


  let fromId = player.toHex();
  let fromWallet = Wallet.load(fromId);
  if (!fromWallet) {
    fromWallet = new Wallet(fromId);
    fromWallet.address = player;
    fromWallet.joined = event.block.timestamp;
    fromWallet.bridgedRealmsHeld = BigInt.fromI32(0);
  }

  fromWallet.bridgedRealmsHeld = fromWallet.bridgedRealmsHeld.plus(BigInt.fromI32(tokenIds.length))

  log.info('length: {}', [tokenIds.length.toString()])



  fromWallet.bridgedRealms = fromWallet.bridgedRealms.concat(tokenIds)
  

  fromWallet.save()

  }

  export function handleUnStakeRealms(event: UnStakeRealmsEvent): void {
    let tokenIds = event.params.tokenIds;
    let player = event.params.player;
  
  
    let fromId = player.toHex();
    let fromWallet = Wallet.load(fromId);
    if (!fromWallet) {
      fromWallet = new Wallet(fromId);
      fromWallet.address = player;
      fromWallet.joined = event.block.timestamp;
      fromWallet.bridgedRealmsHeld = BigInt.fromI32(0);
    }
  
    fromWallet.bridgedRealmsHeld = fromWallet.bridgedRealmsHeld.minus(BigInt.fromI32(tokenIds.length))
  
    let bridgedRealms = fromWallet.bridgedRealms
    for (let i = 0; i < tokenIds.length; ++i) {
      log.info('pushed: {}', [tokenIds[i].toString()])
      var tokenIndex = bridgedRealms.indexOf(tokenIds[i]);

      log.info('index: {}', [tokenIndex.toString()])
      bridgedRealms.splice(tokenIndex, 1);
    }
    fromWallet.bridgedRealms = bridgedRealms

    fromWallet.save()
  
    }
    