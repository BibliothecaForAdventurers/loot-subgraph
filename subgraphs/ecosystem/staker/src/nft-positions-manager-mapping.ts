import { log, Address } from "@graphprotocol/graph-ts"
import {
    Approval,
    ApprovalForAll,
    Collect,
    DecreaseLiquidity,
    IncreaseLiquidity,
    Transfer,
  } from '../generated/NFTPositionsManager/NFTPositionsManager';
  import { Position } from '../generated/schema';
  
  export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
    let entity = Position.load(event.params.tokenId.toHex());
    if (entity == null) {
      entity = new Position(event.params.tokenId.toHex());
      entity.approved = null;
      entity.tokenId = event.params.tokenId;
      entity.owner = event.transaction.from;
      entity.staked = false;
      entity.oldOwner = Address.fromString('0x0000000000000000000000000000000000000000');
    }
    entity.liquidity = event.params.liquidity;
    entity.save();
  }
  
  export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
    let entity = Position.load(event.params.tokenId.toHex());
    if (entity != null) {
      entity.liquidity = event.params.liquidity;
      entity.save();
    }
  }
  
  export function handleTransfer(event: Transfer): void {
    let entity = Position.load(event.params.tokenId.toHex());
  
    if (entity !== null) {
      log.info('transfer entity is {} new owner {]', [entity.owner.toHexString(), entity.oldOwner.toHexString()])
      entity.oldOwner = event.params.from;
      entity.owner = event.params.to;
      entity.approved = null;
      entity.save();
    }
  }
  
  export function handleApproval(event: Approval): void {
    let entity = Position.load(event.params.tokenId.toHex());
    if (entity != null) {
      entity.approved = event.params.approved;
      entity.save();
    }
  }
  
  export function handleApprovalForAll(event: ApprovalForAll): void {}
  
  export function handleCollect(event: Collect): void {}