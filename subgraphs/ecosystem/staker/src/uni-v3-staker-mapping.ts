
import { ethereum, crypto, BigInt, log, Address } from '@graphprotocol/graph-ts';
import {
  DepositTransferred,
  IncentiveCreated,
  IncentiveEnded,
  RewardClaimed,
  TokenStaked,
  TokenUnstaked,
} from '../generated/UniV3Staker/UniV3Staker';
import { Incentive, Position, IncentivePosition } from '../generated/schema';

export function handleIncentiveCreated(event: IncentiveCreated): void {
  let incentiveIdTuple: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(event.params.rewardToken),
    ethereum.Value.fromAddress(event.params.pool),
    ethereum.Value.fromUnsignedBigInt(event.params.startTime),
    ethereum.Value.fromUnsignedBigInt(event.params.endTime),
    ethereum.Value.fromAddress(event.params.refundee),
  ];
  let incentiveIdEncoded = ethereum.encode(
    ethereum.Value.fromTuple(changetype<ethereum.Tuple>(incentiveIdTuple))
  )!;
  let incentiveId = crypto.keccak256(incentiveIdEncoded);

  let entity = Incentive.load(incentiveId.toHex());
  if (entity == null) {
    entity = new Incentive(incentiveId.toHex());
  }

  entity.rewardToken = event.params.rewardToken;
  entity.pool = event.params.pool;
  entity.startTime = event.params.startTime;
  entity.endTime = event.params.endTime;
  entity.refundee = event.params.refundee;
  entity.reward = event.params.reward;
  entity.ended = false;

  entity.save();
}

export function handleIncentiveEnded(event: IncentiveEnded): void {
  let entity = Incentive.load(event.params.incentiveId.toHex());
  if (entity != null) {
    entity.ended = true;
    entity.save();
  }
}

export function handleRewardClaimed(event: RewardClaimed): void { }

export function handleTokenStaked(event: TokenStaked): void {
  let entity = Position.load(event.params.tokenId.toHex());
  let incentive = Incentive.load(event.params.incentiveId.toHex());
  let incentivePosition = IncentivePosition.load(event.params.incentiveId.toHex() + event.params.tokenId.toHex())

  // If incentive is initialized before ELFI-staking, save meaningless entity
  if (!incentive) {
    incentive = new Incentive(event.transaction.hash.toHex());
    incentive.rewardToken = event.transaction.hash;
    incentive.pool = event.transaction.hash;
    incentive.startTime = BigInt.fromI32(0);
    incentive.endTime = BigInt.fromI32(0);
    incentive.refundee = event.transaction.from;
    incentive.reward = BigInt.fromI32(0);
    incentive.ended = true;
    incentive.save();
  }
  if (entity != null) {
    log.info('stake entity is {} new owner {]', [entity.owner.toHexString(), entity.oldOwner.toHexString()])

    entity.staked = true;
    entity.liquidity = event.params.liquidity;
  } else {
    log.info('stake no entity', [])
    entity = new Position(event.params.tokenId.toHex());
    entity.approved = null;
    entity.tokenId = event.params.tokenId;
    entity.liquidity = event.params.liquidity;
    entity.owner = event.transaction.from;
    entity.staked = true;
    entity.oldOwner = Address.fromString('0x0000000000000000000000000000000000000000');
  }

  entity.save();

  if (incentivePosition == null) {
    incentivePosition = new IncentivePosition(event.params.incentiveId.toHex() + event.params.tokenId.toHex());
  }

  incentivePosition.incentive = incentive.id;
  incentivePosition.position = entity.id;
  incentivePosition.active = true;
  incentivePosition.save();
}

export function handleTokenUnstaked(event: TokenUnstaked): void {
  let incentivePosition = IncentivePosition.load(event.params.incentiveId.toHex() + event.params.tokenId.toHex())

  if (incentivePosition != null) {
    incentivePosition.active = false;
    incentivePosition.save();
  }
  
  let entity = Position.load(event.params.tokenId.toHex());
  if (entity != null) {
    entity.staked = false;
    entity.save();
  }
}

export function handleDepositTransferred(event: DepositTransferred): void {
  let entity = Position.load(event.params.tokenId.toHex());

  if (entity != null) {
    log.info('deposit entity is {} new owner {]', [entity.owner.toHexString(), entity.oldOwner.toHexString()])

    entity.staked = false;
    entity.oldOwner = event.params.newOwner;
    entity.owner = event.params.oldOwner;
    entity.save();
  }
}