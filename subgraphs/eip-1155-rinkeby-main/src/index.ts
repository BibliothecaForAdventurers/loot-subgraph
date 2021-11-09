import { ethereum, BigInt, Address, BigDecimal } from '@graphprotocol/graph-ts';

import {
  Account,
  TokenRegistry,
  Token,
  Balance,
  Transfer,
} from '../generated/schema';

import {
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
  ApprovalForAll as ApprovalForAllEvent,
  URI as URIEvent,
} from '../generated/Loot1155/Resources';

import { IERC20 } from '../generated/LordsERC20/IERC20'
import { Transfer as TransferEvent } from '../generated/LordsERC20/LordsERC20'
import { IERC1155MetadataURI } from '../generated/Loot1155/IERC1155MetadataURI';

import {
  constants,
  events,
  integers,
  transactions,
  decimals
} from '@amxx/graphprotocol-utils';

function replaceAll(input: string, search: string[], replace: string): string {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    result += search.includes(input.charAt(i)) ? replace : input.charAt(i);
  }
  return result;
}
function fetchAccount(address: Address): Account {
  let account = new Account(address.toHex())
  account.save()
  return account
}
export function fetchERC20(address: Address): Token {
  let token = Token.load(address.toHex())

  if (token == null) {
    let contract = IERC20.bind(address)
    let name = 'Lords'
    let symbol = 'LORD'
    token = new Token(address.toHex())

    // Common
    token.name = name
    token.symbol = symbol
    token.decimals = 18 as i32
    token.type = 'ERC20'
    token.totalSupply = constants.BIGDECIMAL_ZERO
    token.save()
  }

  return token as Token
}
export const resourceList = [
  'Wood',
  'Stone',
  'Coal',
  'Obsidian',
  'Gold',
  'Silver',
  'Ruby',
  'Sapphire',
  'Adamantine',
  'Mithral',
  'Cold Iron',
  'Diamonds',
  'Copper',
  'Ironwood',
  'Twilight Quartz',
  'Hartwood',
  'Ignium',
  'Ethereal Silica',
  'True Ice',
  'Alchemical Silver',
  'Deep Crystal',
  'Dragonhide',
]

function fetch1155Token(registry: TokenRegistry, id: BigInt): Token {
  let tokenid = registry.id.concat('-').concat(id.toHex());
  let token = Token.load(tokenid);
  if (token == null) {
    token = new Token(tokenid);
    token.registry = registry.id;
    token.identifier = id;
    token.type = 'ERC1155'
    if(id.toI32() !== 0){
    token.symbol = resourceList[id.toI32() - 1]
    }
    token.totalSupply = constants.BIGDECIMAL_ZERO;
  }
  return token as Token;
}

function fetchBalance(token: Token, account: Account): Balance {
  let balanceid = token.id.concat('-').concat(account ? account.id : 'totalSupply');
  let balance = Balance.load(balanceid);
  if (balance == null) {
    balance = new Balance(balanceid);
    balance.token = token.id;
    balance.account = account.id;
    balance.value = constants.BIGDECIMAL_ZERO;
    balance.valueExact = constants.BIGINT_ZERO
    balance.save()
  }
  return balance as Balance;
}

function registerTransfer(
  event: ethereum.Event,
  suffix: string,
  registry: TokenRegistry,
  operator: Account,
  from: Account,
  to: Account,
  id: BigInt,
  value: BigInt
): void {
  let token = fetch1155Token(registry, id);
  let contract = IERC1155MetadataURI.bind(event.address);
  let ev = new Transfer(events.id(event).concat(suffix));

  ev.transaction = transactions.log(event).id;
  ev.timestamp = event.block.timestamp;
  ev.token = token.id;
  ev.operator = operator.id;
  ev.from = from.id;
  ev.to = to.id;
  ev.valueExact = value;
  ev.value = new BigDecimal(value);

  if (from.id == constants.ADDRESS_ZERO) {
    token.totalSupply = token.totalSupply.plus(ev.value);
  } else {
    let balance = fetchBalance(token, from);
    balance.valueExact = balance.valueExact.minus(ev.valueExact);
    balance.value = balance.value.minus(ev.value);
    balance.save();
    ev.fromBalance = balance.id;
  }

  if (to.id == constants.ADDRESS_ZERO) {
    token.totalSupply = token.totalSupply.minus(ev.value);
  } else {
    let balance = fetchBalance(token, to);
    balance.valueExact = balance.valueExact.plus(ev.valueExact);
    balance.value = balance.value.plus(ev.value);

    balance.save();
    ev.toBalance = balance.id;
  }

  let callResult = contract.try_uri(id);
  if (!callResult.reverted) {
    token.URI = callResult.value;
  }


  token.save();
  ev.save();
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  // event.account
  // event.operator
  // event.approved
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  let registry = new TokenRegistry(event.address.toHex());
  let operator = new Account(event.params._operator.toHex());
  let from = new Account(event.params._from.toHex());
  let to = new Account(event.params._to.toHex());
  registry.save();
  operator.save();
  from.save();
  to.save();

  registerTransfer(
    event,
    '',
    registry,
    operator,
    from,
    to,
    event.params._id,
    event.params._amount
  );
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  let registry = new TokenRegistry(event.address.toHex());
  let operator = new Account(event.params._operator.toHex());
  let from = new Account(event.params._from.toHex());
  let to = new Account(event.params._to.toHex());
  registry.save();
  operator.save();
  from.save();
  to.save();

  let ids = event.params._ids;
  let values = event.params._amounts;
  for (let i = 0; i < ids.length; ++i) {
    registerTransfer(
      event,
      '-'.concat(i.toString()),
      registry,
      operator,
      from,
      to,
      ids[i],
      values[i]
    );
  }
}


export function handleURI(event: URIEvent): void {
  let registry = new TokenRegistry(event.address.toHex());
  registry.save();

  let token = fetch1155Token(registry, event.params.id);
  token.URI = event.params.value;
  token.save();



}

export function handleERC20Transfer(event: TransferEvent): void {
  let token = fetchERC20(event.address)
  let from = fetchAccount(event.params.from)
  let to = fetchAccount(event.params.to)

  let ev = new Transfer(events.id(event))
  ev.transaction = transactions.log(event).id
  ev.timestamp = event.block.timestamp
  ev.token = token.id
  ev.from = from.id
  ev.to = to.id
  ev.value = decimals.toDecimals(event.params.value, token.decimals)
  ev.valueExact = event.params.value


  if (from.id == constants.ADDRESS_ZERO) {
    token.totalSupply = token.totalSupply.plus(ev.value);
  } else {
    let fromBalance = fetchBalance(token, from)
    fromBalance.valueExact = fromBalance.valueExact.minus(event.params.value)
    fromBalance.value = decimals.toDecimals(fromBalance.valueExact, token.decimals)
    fromBalance.save()
    ev.fromBalance = fromBalance.id;
  }
  
  if (to.id == constants.ADDRESS_ZERO) {
    token.totalSupply = token.totalSupply.minus(ev.value);
  } else {
    let toBalance = fetchBalance(token, to)
    toBalance.valueExact = toBalance.valueExact.plus(event.params.value)
    toBalance.value = decimals.toDecimals(toBalance.valueExact, token.decimals)
    ev.toBalance = toBalance.id;
    toBalance.save()
  }

  token.save();
  ev.save()
}