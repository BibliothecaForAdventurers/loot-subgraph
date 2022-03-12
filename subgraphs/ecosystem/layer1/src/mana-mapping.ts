import { getTransfer, getWallets, isZeroAddress } from "./utils";
import { Bag, GAdventurer, Mana, Transfer } from "../generated/schema";
import { GenesisMana,  Transfer as TransferEvent  } from "../generated/GenesisProjectMana/GenesisMana";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { updateGAdventurerWithLootTokenIds } from "./gadventurer-mapping";
import { GenesisAdventurer } from "../generated/GenesisProjectAdventurer/GenesisAdventurer";

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

  updateGAdventurerIfSummoned(event);
}

function updateGAdventurerIfSummoned(event: TransferEvent): void {
  // If GA summoning, last transfer will be the ring at logIndex 16
  if (event.logIndex.toString() != "16") {
    return;
  }

  // GAdventurer is the first transfer in transaction
  const transaction = event.transaction.hash.toHex();
  const gaTransfer = Transfer.load(transaction + "-0");

  if (gaTransfer == null || gaTransfer.gAdventurer == null) {
    return;
  }

  const tokenId = gaTransfer.gAdventurer as string;
  const gAdventurer = GAdventurer.load(tokenId);
  if (gAdventurer == null) {
    return;
  }
  updateGAdventurerWithLootTokenIds(
    gAdventurer as GAdventurer,
    [
      getLootIdByManaTransferId(transaction + "-2"), // Weapon
      getLootIdByManaTransferId(transaction + "-4"), // Chest
      getLootIdByManaTransferId(transaction + "-6"), // Head
      getLootIdByManaTransferId(transaction + "-8"), // Waist
      getLootIdByManaTransferId(transaction + "-10"), // Foot
      getLootIdByManaTransferId(transaction + "-12"), // Hand
      getLootIdByManaTransferId(transaction + "-14"), // Neck
      getLootIdByManaTransferId(transaction + "-16") // Ring
    ],
    GenesisAdventurer.bind(event.transaction.to as Address)
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
