# Scaffold-eth Chalenge 5: Meta Multi-Sig Wallet
this repo is for SpeedRunEthereum challenge 5, for building a meta multi signature wallet that allows multiple owners to vote for transactions off-chain and keeps track of these Sigs and Txs in an off-chain DB.

This was mainly done starting from the [Master Branch](https://github.com/scaffold-eth/scaffold-eth-examples/tree/master), and going through the whole process step by step, snipping from [this bransh](https://github.com/scaffold-eth/scaffold-eth-examples/tree/meta-multi-sig/)

# Quick Start:

you are going to need three terminals:

> start the localhost chain
``` bash
yarn chain 
```
> deploy your contract
``` bash
yarn deploy --network localhost
```
> startyour fron-end server
``` bash
yarn start
```
the transactions and signatures are stored on GUN database. Listening and storing to the server (localhost:8000/gun) works automatically, but you can run:
```bash
yarn gun
```
so you make sure it is synced to the browser.
also, check in `App.jsx` if the Gun peer is set to localhost server or not (one of them is commented. when working on local chain, use the local server. we will get to testnets later)

check the functionality of each option, try adding or removig signers, or sending ETH (send the wallet some ETH from the faucet).

# Deploy
if every thing went fine, you can deploy to a testnet. check if you have an account and give it some eth if it does not have.
run:
```bash
yarn deploy --network //testnet name
```
it will be verified automaticaly. if you do not want to verify it yet, just comment the verification section in the `00-deploy-your-contract.js` script in `/hardhat/deploy/` folder.
change the target network in `App.jsx` to the choosen testnetwork.
now check your front-end functionalities.

# Ship
run:
``` bash
yarn build
```
then ship it to surge for example:
``` bash
yarn surge
```

for further information, chexck the [SpeedRunEthereum](https://speedrunethereum.com/) page and join the telegram channel.
