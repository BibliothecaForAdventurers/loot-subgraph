import { GAdventurer, Transfer } from "../generated/schema";
import {
  NameAdventurer,
  NameLostMana,
  ResurrectGACall,
  GenesisAdventurer,
  Transfer as TransferEvent
} from "../generated/GenesisProjectAdventurer/GenesisAdventurer";
import { getTransfer, getWallets, isZeroAddress } from "./utils";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  getGAdventurerGreatness,
  getGAdventurerLevel,
  getGAdventurerRating
} from "./glr-utils";

const V3_CONTRACT_START_TOKEN_ID = BigInt.fromI32(500);

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if (!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.gAdventurersHeld = wallets.fromWallet.gAdventurersHeld.minus(
      BigInt.fromI32(1)
    );
  }
  wallets.fromWallet.save();

  wallets.toWallet.gAdventurersHeld = wallets.toWallet.gAdventurersHeld.plus(
    BigInt.fromI32(1)
  );
  wallets.toWallet.save();

  let gAdventurer = GAdventurer.load(tokenId.toString());
  if (gAdventurer != null) {
    gAdventurer.currentOwner = wallets.toWallet.id;
    gAdventurer.save();
  } else {
    gAdventurer = new GAdventurer(tokenId.toString());
    let contract = GenesisAdventurer.bind(event.address);
    // Loot Token Ids aren't availble yet on inital GA Transfer
    // resurrectGA call handler will fill in lootIds
    updateGAdventurerWithLootTokenIds(gAdventurer, [], contract);
    gAdventurer.currentOwner = wallets.toWallet.id;
    gAdventurer.minted = event.block.timestamp;
    gAdventurer.save();

    // New V3 contract updates renderer
    if (tokenId.equals(V3_CONTRACT_START_TOKEN_ID)) {
      refreshAdventurersBeforeTokenId(
        V3_CONTRACT_START_TOKEN_ID,
        event.address
      );
    }
  }

  let transfer = getTransfer(event, wallets);
  transfer.gAdventurer = tokenId.toString();
  transfer.save();

  
}

export function handleResurrectGA(call: ResurrectGACall): void {
  const transfer = Transfer.load(call.transaction.hash.toHex() + "0");
  if (transfer != null && transfer.gAdventurer != null) {
    const gAdventurer = GAdventurer.load(transfer.gAdventurer as string);
    if (gAdventurer != null) {
      let contract = GenesisAdventurer.bind(call.to);
      updateGAdventurerWithLootTokenIds(
        gAdventurer,
        [
          call.inputs.waistTokenId,
          call.inputs.chestTokenId,
          call.inputs.headTokenId,
          call.inputs.waistTokenId,
          call.inputs.footTokenId,
          call.inputs.handTokenId,
          call.inputs.neckTokenId,
          call.inputs.ringTokenId
        ],
        contract
      );
      gAdventurer.save();
    }
  }
}

export function handleNameAdventurer(event: NameAdventurer): void {
  refreshGAdventurerByTokenId(event.params.tokenId, event.address);
}

export function handleNameLostMana(event: NameLostMana): void {
  refreshGAdventurerByTokenId(event.params.tokenId, event.address);
}

function refreshAdventurersBeforeTokenId(
  tokenId: BigInt,
  contractAddress: Address
): void {
  const start = tokenId.toI32() - 1;
  for (let i = start; i > 0; i--) {
    refreshGAdventurerByTokenId(BigInt.fromI32(i), contractAddress);
  }
}

function refreshGAdventurerByTokenId(
  tokenId: BigInt,
  contractAddress: Address
): void {
  let adventurer = GAdventurer.load(tokenId.toString());
  if (adventurer) {
    let contract = GenesisAdventurer.bind(contractAddress);
    updateGAdventurerWithLootTokenIds(
      adventurer,
      contract.getLootTokenIds(tokenId),
      contract
    );
    adventurer.save();
  }
}

export function updateGAdventurerWithLootTokenIds(
  gAdventurer: GAdventurer,
  lootTokenIds: BigInt[],
  contract: GenesisAdventurer
): void {
  const tokenId = BigInt.fromString(gAdventurer.id);
  gAdventurer.weapon = contract.getWeapon(tokenId);
  gAdventurer.chest = contract.getChest(tokenId);
  gAdventurer.head = contract.getHead(tokenId);
  gAdventurer.waist = contract.getWaist(tokenId);
  gAdventurer.foot = contract.getFoot(tokenId);
  gAdventurer.hand = contract.getHand(tokenId);
  gAdventurer.neck = contract.getNeck(tokenId);
  gAdventurer.ring = contract.getRing(tokenId);
  gAdventurer.order = contract.getOrder(tokenId);
  gAdventurer.orderColor = contract.getOrderColor(tokenId);
  gAdventurer.orderCount = contract.getOrderCount(tokenId);
  gAdventurer.tokenURI = contract.tokenURI(tokenId);

  if (lootTokenIds.length == 0) {
    gAdventurer.lootTokenIds = [];
    gAdventurer.bagGreatness = 0;
    gAdventurer.bagLevel = 0;
    gAdventurer.bagRating = 0;
  } else {
    gAdventurer.lootTokenIds = lootTokenIds.map(function(
      tokenId: BigInt,
      index: i32,
      array: BigInt[]
    ): i32 {
      return tokenId.toI32();
    });
    gAdventurer.bagGreatness = getGAdventurerGreatness(gAdventurer);
    gAdventurer.bagLevel = getGAdventurerLevel(gAdventurer);
    gAdventurer.bagRating = getGAdventurerRating(gAdventurer);
  }
}
