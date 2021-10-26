import { RealmStaked as RealmStakedEvent, RealmData as RealmDataEvent } from '../generated/Diamond/diamond';
import { getTransfer, getWallets, isZeroAddress, resourceList, traitsList } from './utils';

import { Realm, SRealm } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';

interface Resource {
    id: number
    name: String
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
    let srealm = SRealm.load(event.params._tokenId.toString());
    if (srealm) {
        srealm.name = event.params._name;
        srealm.order = event.params._orderOf;
        if (srealm.wonder) {
          srealm.wonder = event.params._wonder;
        }
        srealm.resources = event.params._resources
       /* const resources = event.params._resources;
        if(resources){
        let resourceArray = srealm.resources

        for (let i = 0; i < resources.length; i++) {
            let element = {} as Resource;
            element.id = resources[i];
            element.name = 'test';
            
            resourceArray.push(element);
        }

        srealm.resources = resourceArray
        }*/
        const traits = event.params._traits
        srealm.regions = traits[0],
        srealm.cities = traits[1],
        srealm.harbors = traits[2],
        srealm.rivers = traits[3]
        

        srealm.save();
    }
}