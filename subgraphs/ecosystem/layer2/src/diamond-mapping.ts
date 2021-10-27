import { RealmStaked as RealmStakedEvent, RealmData as RealmDataEvent } from '../generated/Diamond/diamond';
import { checkRealmRarity, getTransfer, getWallets, isZeroAddress, resourceList, traitsList } from './utils';

import { Realm, SRealm, Resource } from '../generated/schema';
import { BigInt, BigDecimal } from '@graphprotocol/graph-ts';



export function handleRealmStakedEvent(event: RealmStakedEvent): void {
    let srealm = SRealm.load(event.params._realmStaked.toString());
    if (srealm) {
        srealm.ageSettled = event.params._age;
        srealm.ageClaimed = event.params._age;
        srealm.save();
    }
}

export function handleRealmDataEvent(event: RealmDataEvent): void {
    let srealm = SRealm.load(event.params._tokenId.toString());
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
            resources.push(resource.id)
        }
        srealm.resources = resources

        const traits = event.params._traits
        srealm.regions = traits[0],
            srealm.cities = traits[1],
            srealm.harbors = traits[2],
            srealm.rivers = traits[3]
        const rarity = checkRealmRarity(traits, eventResources, wonder)
        srealm.rarityScore = BigDecimal.fromString(rarity)
        srealm.save();
    }
}