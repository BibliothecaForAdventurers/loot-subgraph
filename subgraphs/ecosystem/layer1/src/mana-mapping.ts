import { getTransfer, getWallets, isZeroAddress } from "./utils";
import { Bag, GAdventurer, Mana, Transfer } from "../generated/schema";
import { GenesisMana,  Transfer as TransferEvent  } from "../generated/GenesisProjectMana/GenesisMana";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { updateGAdventurerWithLootTokenIds } from "./gadventurer-mapping";
import { GenesisAdventurer } from "../generated/GenesisProjectAdventurer/GenesisAdventurer";

const GENESIS_ADVENTURER_CONTRACT = "0x8db687aceb92c66f013e1d614137238cc698fedb";

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);

  if (!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.manasHeld = wallets.fromWallet.manasHeld.minus(
      BigInt.fromI32(1)
    );
  }
  wallets.fromWallet.save();

  wallets.toWallet.manasHeld = wallets.toWallet.manasHeld.plus(
    BigInt.fromI32(1)
  );
  wallets.toWallet.save();

  let lootTokenId = "";
  let mana = Mana.load(tokenId.toString());
  if (mana != null) {
    mana.currentOwner = wallets.toWallet.id;
    mana.save();
  } else {
    mana = new Mana(tokenId.toString());
    let contract = GenesisMana.bind(event.address);
    let manaDetails = contract.detailsByToken(tokenId);
    lootTokenId = manaDetails.value0.toString();

    mana.lootTokenId = lootTokenId;
    mana.itemName = manaDetails.value1;
    mana.suffixId = manaDetails.value2;
    mana.inventoryId = manaDetails.value3;
    mana.currentOwner = wallets.toWallet.id;
    mana.minted = event.block.timestamp;
    mana.save();
  }
  let bag = Bag.load(lootTokenId);
  if (bag != null) {
    if (bag.manasClaimed)
      bag.manasClaimed = bag.manasClaimed.plus(BigInt.fromI32(1));
    bag.save();
  }

  let transfer = getTransfer(event, wallets);
  transfer.mana = tokenId.toString();
  transfer.save();

  // If GA summoning, last transfer will be the ring
  if (mana.inventoryId == 7) {
    updateGAdventurerIfSummoned(event);
  }
  
}

function updateGAdventurerIfSummoned(event: TransferEvent): void {
  // GAdventurer is the first transfer in transaction
  const transaction = event.transaction.hash.toHex();
  const gaTransfer = Transfer.load(getTransferId(transaction, event, 16));

  if (gaTransfer == null || gaTransfer.gAdventurer == null) {
    return;
  }

  const tokenId = gaTransfer.gAdventurer as string;
  const gAdventurer = GAdventurer.load(tokenId);
  if (gAdventurer == null) {
    return;
  }
  const weaponTransferId = getTransferId(transaction, event, 14);
  const chestTransferId = getTransferId(transaction, event, 12);
  const headTransferId = getTransferId(transaction, event, 10);
  const waistTransferId = getTransferId(transaction, event, 8);
  const footTransferId = getTransferId(transaction, event, 6);
  const handTransferId = getTransferId(transaction, event, 4);
  const neckTransferId = getTransferId(transaction, event, 2);
  const ringTransferId = getTransferId(transaction, event, 0);

  updateGAdventurerWithLootTokenIds(
    gAdventurer as GAdventurer,
    [
      getLootIdByManaTransferId(weaponTransferId),
      getLootIdByManaTransferId(chestTransferId),
      getLootIdByManaTransferId(headTransferId),
      getLootIdByManaTransferId(waistTransferId),
      getLootIdByManaTransferId(footTransferId),
      getLootIdByManaTransferId(handTransferId),
      getLootIdByManaTransferId(neckTransferId),
      getLootIdByManaTransferId(ringTransferId)
    ],
    GenesisAdventurer.bind(Address.fromString(GENESIS_ADVENTURER_CONTRACT))
  );
  gAdventurer.save();
}

function getLootIdByManaTransferId(transferId: string): BigInt {
  const manaTransfer = Transfer.load(transferId);
  if (manaTransfer == null || manaTransfer.mana == null) {
    return BigInt.fromI32(0);
  }
  const mana = Mana.load(manaTransfer.mana as string);
  if (mana == null || mana.lootTokenId == null) {
    return BigInt.fromI32(0);
  }
  return BigInt.fromString(mana.lootTokenId);
}

function getTransferId(
  transaction: string,
  event: TransferEvent,
  minus: i32
): string {
  return (
    transaction + "-" + event.logIndex.minus(BigInt.fromI32(minus)).toString()
  );
}