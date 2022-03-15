import { Transfer as TransferEvent } from '../generated/LootRealm/LootRealm';
import { isZeroAddress, getWallets, getTransfer, checkRealmRarity, resourceList } from './utils';
import { rarityArray } from './realm-rarity';
import { Realm, Resource, RealmResource  } from '../generated/schema';
import { LootRealm} from '../generated/LootRealm/LootRealm';

import { Address, log, BigDecimal, BigInt, Bytes, ipfs, json, JSONValue, TypedMap, JSONValueKind } from '@graphprotocol/graph-ts';

const journeyAddress = "0x17963290db8c30552d0cfa2a6453ff20a28c31a2"
const carrackAddress = "0xcdfe3d7ebfa793675426f150e928cd395469ca53"

export function handleTransfer(event: TransferEvent): void {
  let tokenId = event.params.tokenId;
  let wallets = getWallets(event.params.from, event.params.to, event);
  log.info("starting realms {}", [tokenId.toString()]);

  if(!isZeroAddress(wallets.fromWallet.id)) {
    wallets.fromWallet.realmsHeld = wallets.fromWallet.realmsHeld.minus(BigInt.fromI32(1))
  }

  wallets.toWallet.realmsHeld = wallets.toWallet.realmsHeld.plus(BigInt.fromI32(1));

  let realm = Realm.load(tokenId.toString());

  if (realm != null) {
    log.error('realm test not null {}', [tokenId.toString()])
    realm.currentOwner = wallets.toWallet.id;
    if(event.params.from.toHexString() == journeyAddress) {
      wallets.toWallet.bridgedRealmsHeld = wallets.toWallet.bridgedRealmsHeld.minus(BigInt.fromI32(1))
      realm.bridgedOwner = null
    }
    if(event.params.from.toHexString() == carrackAddress) {
      wallets.toWallet.bridgedV2RealmsHeld = wallets.toWallet.bridgedV2RealmsHeld.minus(BigInt.fromI32(1))
      realm.bridgedV2Owner = null
    }
    if(event.params.to.toHexString() == journeyAddress) {
      wallets.fromWallet.bridgedRealmsHeld = wallets.fromWallet.bridgedRealmsHeld.plus(BigInt.fromI32(1))
      realm.bridgedOwner = wallets.fromWallet.id
    }
    if(event.params.to.toHexString() == carrackAddress) {
      wallets.fromWallet.bridgedV2RealmsHeld = wallets.fromWallet.bridgedV2RealmsHeld.plus(BigInt.fromI32(1))
      realm.bridgedV2Owner = wallets.fromWallet.id
    }
  } else {
    realm = new Realm(tokenId.toString());
    realm.tokenId = tokenId.toI32()
    let tokenrarityRank = rarityArray[tokenId.toI32() - 1]
    realm.rarityRank = BigInt.fromI32(tokenrarityRank);
    realm.currentOwner = wallets.toWallet.id;
    realm.minted = event.block.timestamp;
    realm.bridgedOwner = null
    realm.bridgedV2Owner = null

    const attrs = getAttrsFromIPFS(realm);
    addAttributes(realm, attrs);

  }
  wallets.fromWallet.totalRealms = wallets.fromWallet.bridgedRealmsHeld.plus(wallets.fromWallet.realmsHeld).plus(wallets.fromWallet.bridgedV2RealmsHeld)
  wallets.toWallet.totalRealms = wallets.toWallet.bridgedRealmsHeld.plus(wallets.toWallet.realmsHeld).plus(wallets.toWallet.bridgedV2RealmsHeld)

  wallets.fromWallet.save()
  wallets.toWallet.save()
  realm.save();

  let transfer = getTransfer(event, wallets)  
  transfer.realm = tokenId.toString();

  transfer.save();


  }
  


const hashBytes = ipfs.cat("QmWReRrVee1fnDa2KwbaRZFkmt2yMKcNQRxzkSqENQiNZW");
let hashes: JSONValue[] = []
if (hashBytes) {
  hashes = json.fromBytes(hashBytes as Bytes).toArray();
} else {
  log.info("Couldn't get hash registry", []);
}

function setStringAttribute(realm: Realm, obj: TypedMap<string, JSONValue>, attribute: string, alias: string | null = null): void {
  log.info("Setting {} on realm id {}", [attribute, realm.id])
  const val = obj.get(attribute);
  if (val) {
    let stringVal = val.toString()
    if (attribute == "order") {
      stringVal = stringVal.substring(13)
    }
    log.info("Setting {} to {} on {}", [attribute, stringVal, realm.id])
    realm.setString(alias ? alias : attribute, stringVal);
  }
}

function setIntAttribute(realm: Realm, obj: TypedMap<string, JSONValue>, attribute: string, alias: string | null = null): void {
  log.info("attempting to set {} on realm {}", [attribute, realm.id])
  const val = obj.get(attribute);
  if (val) {
    let intVal: i32;

    assert(val.kind == JSONValueKind.NUMBER, 'setNumTraitsIntAttribute on realm ' + realm.id +  ' + JSON value is not a number, it is ' + val.kind.toString())
    intVal = val.toI64() as i32;
    
    log.info("Setting {} to {} on {}", [attribute, intVal.toString(), realm.id])
    realm.setI32(alias ? alias : attribute, intVal);
  }
}
function getAttrsFromIPFS(realm: Realm): TypedMap<string, JSONValue> {
  const realmId = parseInt(realm.id) as i32;
  log.debug("loading realm {} hash ", [realm.id]);
  log.debug("loading from IPFS file: {}", [hashes[7999].toString()]);

  const hash = hashes[realmId - 1].toString();
  log.debug("loading realm {} attrs from IPFS file: {}", [realm.id, hash]);
  const data = ipfs.cat(hash);
  if (data) {
    const val = json.fromBytes(data);
    assert(val.kind == JSONValueKind.OBJECT, "Chikn Attributes from IPFS was not type " + JSONValueKind.OBJECT.toString() + " (JSONValueKind.OBJECT), it was type " + val.kind.toString());
    return val.toObject();
  } else {
    throw new Error("Realm attributes content was null from IPFS file " + hash);
  }
}
export function addAttributes(realm: Realm, attrsObj: TypedMap<string, JSONValue>): void {
  setStringAttribute(realm, attrsObj, "name");
  setStringAttribute(realm, attrsObj, "order");
  setStringAttribute(realm, attrsObj, "wonder");
  setIntAttribute(realm, attrsObj, "regions");
  setIntAttribute(realm, attrsObj, "cities");
  setIntAttribute(realm, attrsObj, "harbours");
  setIntAttribute(realm, attrsObj, "rivers");

  const val = attrsObj.get("rarityScore");
  if (val) {
    let intVal: BigDecimal;

    intVal = BigDecimal.fromString(val.toString());
    
    log.info("Setting {} to {} on {}", ["Rarity Score", intVal.toString(), realm.id])
    realm.rarityScore = intVal
  }

  const resourceIdVal = attrsObj.get("resourceIds")

  let resourceIds = new Array<i32>()

  if (resourceIdVal) {
    let array = resourceIdVal.toArray()
    log.info("attempting to set Resources on realm {}", [realm.id])

    for (let i = 0; i < array.length; i++) {
      let intVal: i32;

      log.info("array kind {} index {} for values {} on realm {}", [array[i].kind.toString(), i.toString(), intVal.toString(), realm.id])

      assert(array[i].kind == JSONValueKind.NUMBER, 'setting Resources on realm ' + realm.id +  ' + JSON value is not a number, it is ' + array[i].kind.toString())
      intVal = array[i].toI64() as i32;


      log.info("Setting Resources to {} on {}", [intVal.toString(), realm.id])
      resourceIds.push(intVal)
      
    }
  }

  realm.resourceIds = resourceIds
  for (let i = 0; i < resourceIds.length; i++) {
      let resource = Resource.load(resourceIds[i].toString());
      const resourceInt = resourceIds[i]
      if (!resource) {
          resource = new Resource(resourceIds[i].toString());
          resource.name = resourceList[resourceInt - 1].name
          resource.totalRealms = resourceList[resourceInt - 1].realms
          resource.save();
      }

      const realmResourceId = realm.id.toString().concat('-').concat(resource.id)
      log.info('realmresourceid: {}', [realmResourceId])

      let realmResource = RealmResource.load(realmResourceId)
      if (!realmResource) {
          realmResource = new RealmResource(realmResourceId);
          realmResource.realm = realm.id
          realmResource.resource = resource.id
          realmResource.save()
          log.info('pushed: {}', [realmResource.id])
      }
  }
}
