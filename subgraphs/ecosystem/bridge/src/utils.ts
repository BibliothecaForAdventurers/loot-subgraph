import { Transfer, Wallet} from '../generated/schema';
import { BigInt, Address, ethereum } from '@graphprotocol/graph-ts';

export class WalletInterface {
  fromWallet: Wallet
  toWallet: Wallet;
}
export function isZeroAddress(string: string): boolean {
    return string == '0x0000000000000000000000000000000000000000';
  }
  
  export function getWallets(from: Address, to: Address, event: ethereum.Event ): WalletInterface {
    let fromAddress = from;
    let toAddress = to;

    let fromId = fromAddress.toHex();
    let fromWallet = Wallet.load(fromId);
    if (!fromWallet) {
      fromWallet = new Wallet(fromId);
      fromWallet.address = fromAddress;
      fromWallet.joined = event.block.timestamp;
      fromWallet.bridgedRealmsHeld = BigInt.fromI32(0);
    }
    
    let toId = toAddress.toHex();
    let toWallet = Wallet.load(toId);
    if (!toWallet) {
      toWallet = new Wallet(toId);
      toWallet.address = toAddress;
      toWallet.joined = event.block.timestamp;
      toWallet.bridgedRealmsHeld = BigInt.fromI32(0);
    }

    return { 
      fromWallet, 
      toWallet
    }
  }
