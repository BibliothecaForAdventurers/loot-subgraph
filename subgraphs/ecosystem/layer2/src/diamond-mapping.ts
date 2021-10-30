import { RealmStaked as RealmStakedEvent, RealmData as RealmDataEvent, RaidResult as RaidResultEvent, ResourceUpgraded as ResourceUpgradedEvent, ConstructionEvent } from '../generated/Diamond/diamond';
import { checkRealmRarity, getTransfer, initWallet, isZeroAddress, resourceList, traitsList } from './utils';

import { RealmResource, SRealm, Resource, RaidResult, ResourceUpgrade, RealmTrait, RealmBuilding, BuildingUpgrade } from '../generated/schema';
import { log, BigInt, BigDecimal } from '@graphprotocol/graph-ts';

class RealmBuildingInterface {
    name: string
    traitId: i32
  }
  
enum RealmTraitOption {
    regions,
    cities,
    harbors,
    rivers,
}
enum Buildings {
    markets = 1,
    aqueducts = 3,
    castles = 0,
    ports = 2,
    barracks = 1,
    farms = 1,
    temples = 0,
    shipyard = 2,
    fishing_village = 3
  }
export function handleRealmStakedEvent(event: RealmStakedEvent): void {
    let srealm = SRealm.load(event.params._realmStaked.toString());
    if (srealm) {
        srealm.ageSettled = event.params._age;
        srealm.ageClaimed = event.params._age;
        srealm.save();
    }
}

export function handleRealmDataEvent(event: RealmDataEvent): void {
    const tokenId = event.params._tokenId
    log.info('test: {}', ['test here'])

    let srealm = SRealm.load(tokenId.toString());
    if (srealm) {
        srealm.name = event.params._name;
        srealm.order = event.params._orderOf;
        const wonder = event.params._wonder;

        if (wonder) {
            srealm.wonder = wonder;
        }
        const eventResources = event.params._resources;
        let resources = new Array<string>();

        for (let i = 0; i < eventResources.length; i++) {
            let resource = Resource.load(eventResources[i].toString());
            if (!resource) {
                resource = new Resource(eventResources[i].toString());
                resource.name = resourceList[eventResources[i] - 1].name
                resource.totalRealms = resourceList[eventResources[i] - 1].realms
                resource.stakedRealms = BigInt.fromI32(0)
            }
            resource.stakedRealms = resource.stakedRealms.plus(BigInt.fromI32(1))
            resource.save();

            const realmResourceId = tokenId.toString().concat('-').concat(eventResources[i].toString())
            log.info('realmresourceid: {}', [realmResourceId])

            let realmResource = RealmResource.load(realmResourceId)
            if (!realmResource) {
                realmResource = new RealmResource(realmResourceId);
                realmResource.resource = resource.id
                realmResource.level = BigInt.fromI32(0)
                realmResource.save()
                resources.push(realmResource.id)
                log.info('pushed: {}', [realmResource.id])

            }
        }
        srealm.resources = resources
        let realmTraits = new Array<string>();

        const realmTraitOptions = [
            'regions',
            'cities',
            'harbors',
            'rivers',]
        const traits = event.params._traits
        for (let i = 0; i < traits.length; i++) {
            const traitName = realmTraitOptions[i]
            const realmTrait = new RealmTrait(tokenId.toString().concat('-').concat(i.toString()))
            realmTrait.name = traitName
            realmTrait.value = traits[i]
            realmTrait.sRealm = srealm.id
            realmTrait.buildings = []
            realmTrait.save()
            realmTraits.push(realmTrait.id)
        }
        srealm.traits = realmTraits
        const rarity = checkRealmRarity(traits, eventResources, wonder)
        srealm.rarityScore = BigDecimal.fromString(rarity)
        srealm.save();
    } else {
        log.warning('No realm yet', [tokenId.toString()])
    }
}

export function handleRaidResult(event: RaidResultEvent): void {
    let raidId = event.transaction.hash

    let raid = RaidResult.load(raidId.toHex());
    if (!raid) {

        let fromWallet = initWallet(event.params.attackerAddress, event);
        let toWallet = initWallet(event.params.defenderAddress, event);

        fromWallet.raidAttacks = fromWallet.raidAttacks.plus(BigInt.fromI32(1))
        fromWallet.save()

        toWallet.raidDefends = toWallet.raidDefends.plus(BigInt.fromI32(1))
        log.info('raid defends: {}', [toWallet.raidDefends.toString(),])
        toWallet.save()
        raid = new RaidResult(raidId.toHex());


        raid.raider = toWallet.id;
        raid.defender = toWallet.id;
        raid.raiderRealm = event.params.attackingRealm.toString()
        raid.defenderRealm = event.params.defendingRealm.toString()
        raid.raiderUnitsLost = event.params.raidingUnitsLost
        raid.defenderUnitsLost = event.params.defendingUnitsLost
        raid.unitsCaptured = event.params.unitsCaptured

        raid.save();

    }

}

export function handleResourceUpgraded(event: ResourceUpgradedEvent): void {
    let realmResource = RealmResource.load(event.params.realmID.toString() + '-' + event.params.buildingID.toString());
    if (realmResource) {
        let resourceUpgradedId = realmResource.id + realmResource.level.plus(BigInt.fromI32(1)).toString()

        let resourceUpgrade = ResourceUpgrade.load(resourceUpgradedId);
        if (!resourceUpgrade) {
            realmResource.level = realmResource.level.plus(BigInt.fromI32(1))
            realmResource.save()
            let wallet = initWallet(event.params.lord, event);
            wallet.save()

            let resourceUpgrade = new ResourceUpgrade(resourceUpgradedId);
            resourceUpgrade.address = wallet.id
            resourceUpgrade.timestamp = event.block.timestamp

            resourceUpgrade.save();

        }
    }
}

export function handleConstructionEvent(event: ConstructionEvent): void {
    const buildingId = event.params.buildingId

    const realmTraitOptions: RealmBuildingInterface[] = [
        {name: 'markets', traitId: 1},
        {name: 'aqueducts', traitId: 3},
        {name: 'castles', traitId: 0},
        {name: 'ports', traitId: 2},
        {name: 'barracks', traitId: 1},
        {name: 'farms', traitId:1},
        {name: 'temples', traitId:0},
        {name: 'shipyard', traitId:2},
        {name: 'fishing_village', traitId:3}
    ]
    const traitId = realmTraitOptions[buildingId.toI32()].traitId
    let realmTrait = RealmTrait.load(event.params.realmTokenId.toString().concat('-').concat(traitId.toString()));
    if (realmTrait) {
        let realmBuilding = RealmBuilding.load(realmTrait.id.concat('-').concat(buildingId.toString()))
        if (!realmBuilding) {
            realmBuilding = new RealmBuilding(realmTrait.id.concat('-').concat(buildingId.toString()))
            realmBuilding.name = realmTraitOptions[buildingId.toI32()].name
            realmBuilding.value = BigInt.fromI32(0)
            realmBuilding.realmTrait = realmTrait.id 
        }        
        realmBuilding.value = realmBuilding.value.plus(BigInt.fromI32(1))
        realmBuilding.save()
        if (realmTrait.buildings) {
        realmTrait.buildings = realmTrait.buildings.concat([realmBuilding.id])
        }
        realmTrait.save()
        let wallet = initWallet(event.params.owner, event);
        wallet.save()

        let buildingUpgrade = new BuildingUpgrade(realmBuilding.id.concat('-').concat(realmBuilding.value.toString()))

        buildingUpgrade.address = wallet.id
        buildingUpgrade.buildingUpgraded = realmBuilding.id
        buildingUpgrade.timestamp = event.block.timestamp
        buildingUpgrade.save()
    }
}