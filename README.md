# loot-subgraph

Configure a TheGraph Subgraph for Realms and other Lootverse primitives which enables querying bags and transfer data.

## Installation
1. Intall dependencies: `npm install`
2. Generate mapping artifacts: `npm run codegen`
3. Build the subgraph: `npm run build`

## Folder Structure

Contract addresses live in `/config/` with a .json file for each chain.

Subgraphs live in the `/subgraphs/ecosystem` folder, organized by chain. For example `/subgraphs/ecosystem/layer1` has all Eth mainnet files.

## Extending for other projects

To add other projects (e.g. Crypts and Caverns) to this subgraph:

1. Copy base contract abi into `subgraphs/ecosystem/layer1/abis/<yourproject>.abi`
2. Add your contract address and start block into `config/mainnet.json` and `config/rinkeby.json`
3. Update `subgraphs/ecosystem/layer1/subgraph.template.yaml` with a new `- kind` entry for your contract
4. Add your schema to `subgraphs/ecosystem/layer1/schema.graphql`
5. Add a new variable for your project to `transferEvent()` in `subgraphs/ecosystem/layer1/schema.graphql`
6. Edit `subgraphs/ecosystem/layer1/src/<yourproject>-mapping.ts` to map your contract to your schema
7. Add a new variable for `fromWallet.<yourproject>Held` and `toWallet.<yourproject>Held` to `subgraphs/ecosystem/layer1/src/utils.js`



## Testing your changes

1. Change directory to `subgraphs/ecosystem/layer1`
2. Run `npm run prepare:rinkeby` from that folder
3. Generate mapping artifacts from base contract: `npm run codegen`
4. Verify that your 
