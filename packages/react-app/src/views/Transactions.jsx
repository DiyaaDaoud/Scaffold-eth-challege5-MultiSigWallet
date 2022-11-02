import { useState } from "react";
import { usePoller } from "../hooks";
import { ethers } from "ethers";
import { Button, List, Spin } from "antd";
import { TransactionListItem, Blockie } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { CodeOutlined } from "@ant-design/icons";

const axios = require("axios");

export default function Transcations({
  readContracts,
  contractName,
  nonce,
  localProvider,
  userProvider,
  userSigner,
  gun,
  address,
  signaturesRequired,
  mainnetProvider,
  price,
  blockExplorer,
  tx,
  writeContracts,
}) {
  const [transactions, setTransactions] = useState();
  const contractAddress = readContracts && readContracts[contractName] ? readContracts[contractName].address : "";
  const totalTransactions = [];
  let txs;
  if (
    readContracts &&
    readContracts[contractName] &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId
  ) {
    // localStorage.removeItem("gun/");
    gun
      .get(contractAddress + "_" + (localProvider && localProvider._network && localProvider._network.chainId))
      .put(null);
    txs = gun.get(contractAddress + "_" + (localProvider && localProvider._network && localProvider._network.chainId));
    txs.map().once(async transaction => {
      totalTransactions.push(transaction);
    });
    console.log("gundb txs", totalTransactions);
  }
  usePoller(() => {
    const getTransactions = async () => {
      if (true) console.log("🛰 Requesting Transaction List");
      const newTransactions = [];
      for (const i in totalTransactions) {
        if (totalTransactions[i]) {
          console.log("I am in the txs for loop in transaction page with index: ", i);
          const thisNonce = ethers.BigNumber.from(totalTransactions[i].nonce);
          console.log("thisNonce is :", thisNonce.toString());
          if (thisNonce && nonce && thisNonce.gte(nonce)) {
            const validSignatures = [];
            const signatures = totalTransactions[i].signatures.split(",");
            console.log("tx", i, " hash is : ", totalTransactions[i].hash);
            for (const s in signatures) {
              console.log("the signature ", s, " of tx ", i, " is: ", signatures[s]);
              const signer = await readContracts[contractName].recover(totalTransactions[i].hash, signatures[s]);
              console.log("Signer", s, " of tx ", i, " is: ", signer);
              const isOwner = await readContracts[contractName].isOwner(signer);
              if (signer && isOwner) {
                validSignatures.push({ signer, signature: signatures[s] });
              }
            }
            const update = { ...totalTransactions[i], validSignatures };
            console.log("Transactions page: update", update);
            newTransactions.push(update);
          }
        }
        setTransactions(newTransactions);
        console.log("Transactions page: got the new transactions pushed into");
        console.log("they are: ", transactions);
      }
    };
    if (readContracts) getTransactions();
  }, 15000);
  const getSortedSigList = async (allSigs, newHash) => {
    const sigList = [];
    for (const s in allSigs) {
      //console.log("SIG", allSigs[s]);
      const recover = await readContracts[contractName].recover(newHash, allSigs[s]);
      sigList.push({ signature: allSigs[s], signer: recover });
    }

    sigList.sort((a, b) => {
      return ethers.BigNumber.from(a.signer).sub(ethers.BigNumber.from(b.signer));
    });

    // console.log("SORTED SIG LIST:", sigList);

    const finalSigList = [];
    const finalSigners = [];
    const used = {};
    for (const s in sigList) {
      if (!used[sigList[s].signature]) {
        finalSigList.push(sigList[s].signature);
        finalSigners.push(sigList[s].signer);
      }
      used[sigList[s].signature] = true;
    }

    //console.log("FINAL SIG LIST:", finalSigList);
    return [finalSigList, finalSigners];
  };

  if (!signaturesRequired) {
    return <Spin />;
  }
  return (
    <div>
      <div style={{ maxWidth: 1150, margin: "auto", marginTop: 32, marginBottom: 32 }}>
        <h1>
          <b style={{ padding: 16 }}>#{nonce ? nonce.toNumber() : <Spin />}</b>
        </h1>
        <List
          header={
            <table>
              <tr>
                <th style={{ width: 50 }}>
                  <span>
                    <Blockie size={4} scale={8} /> nonce
                  </span>
                </th>
                <th style={{ width: 175 }}>
                  <span>
                    <Blockie size={4} scale={8} /> Transaction
                  </span>
                </th>
                <th style={{ width: 175 }}>
                  <span>
                    <Blockie size={4} scale={8} /> To
                  </span>
                </th>
                <th style={{ width: 125 }}>
                  <span>
                    <Blockie size={4} scale={8} /> Tx Hash
                  </span>
                </th>
                <th style={{ width: 125 }}>
                  <span>
                    <Blockie size={4} scale={8} /> From
                  </span>
                </th>
                <th style={{ width: 75 }}>
                  <span>
                    <Blockie size={4} scale={8} /> Tx value
                  </span>
                </th>
                <th style={{ width: 75 }}>
                  <span>
                    <Blockie size={4} scale={8} /> Sigs
                  </span>
                </th>
              </tr>
            </table>
          }
          bordered
          dataSource={transactions}
          renderItem={item => {
            const hasSigned = item.signers.indexOf(address) >= 0;
            const hasEnoughSignatures = item.signatures.length <= signaturesRequired.toNumber();
            return (
              <div>
                <TransactionListItem
                  item={item}
                  mainnetProvider={mainnetProvider}
                  blockExplorer={blockExplorer}
                  price={price}
                  readContracts={readContracts}
                  contractName={contractName}
                >
                  <span>
                    {item.signatures.split(",").length}/{signaturesRequired.toNumber()} {hasSigned ? "✅" : ""}
                  </span>
                  <Button
                    onClick={async () => {
                      console.log("item.signatures", item.signatures.split(","));
                      const newHash = await readContracts[contractName].getTranscationHash(
                        item.to,
                        item.nonce,
                        parseEther("" + parseFloat(item.amount).toFixed(12)),
                        item.data,
                      );
                      console.log("newHash", newHash);

                      const signature = await userSigner.signMessage(ethers.utils.arrayify(newHash));
                      console.log("signature", signature);

                      const recover = await readContracts[contractName].recover(newHash, signature);
                      console.log("recover--->", recover);
                      const isOwner = await readContracts[contractName].isOwner(recover);
                      console.log("isOwner", isOwner);

                      if (isOwner) {
                        const [finalSigList, finalSigners] = await getSortedSigList(
                          [...item.signatures.split(","), signature],
                          newHash,
                        );
                        console.log("sign function : finalSigners are :", finalSigners);
                        console.log("sign function : finalSignatures are :", finalSigList);
                        const joinedSigList = finalSigList.join();
                        const joinedFinalSigners = finalSigners.join();
                        console.log("sign function : joinedFinalSigners are :", joinedFinalSigners);
                        console.log("sign function : joinedSigList are :", joinedSigList);

                        const { validSignatures, ...simpleItem } = item;
                        //we remove this array that was previously added to the object, just to deal with GunDB, as it is not necessary. There are probably better ways of doing this...
                        const newItem = {
                          ...simpleItem,
                          signatures: joinedSigList,
                          signers: joinedFinalSigners,
                        };
                        const newSigTx = await gun.get(newItem.hash + "newSig").put(newItem);
                        await txs.set(newSigTx);
                      }
                    }}
                    type="secondary"
                  >
                    Sign
                  </Button>
                  <Button
                    key={item.hash}
                    onClick={async () => {
                      if (item.amount > 0) {
                        let from = item.signers.split(",")[0];
                      }
                      const newHash = await readContracts[contractName].getTranscationHash(
                        item.to,
                        item.nonce,
                        parseEther("" + parseFloat(item.amount).toFixed(12)),
                        item.data,
                      );
                      console.log("newHash", newHash);

                      console.log("item.signatures", item.signatures.split(","));

                      const [finalSigList, finalSigners] = await getSortedSigList(item.signatures.split(","), newHash);
                      console.log("ecexute transaction: to:", item.to);
                      console.log("ecexute transaction: data:", item.data);
                      console.log(
                        "ecexute transaction: value:",
                        parseEther("" + parseFloat(item.amount).toFixed(12)).toString(),
                      );

                      tx(
                        writeContracts[contractName].executeTransaction(
                          item.to,
                          parseEther("" + parseFloat(item.amount).toFixed(12)),
                          item.data,
                          finalSigList,
                          { gasLimit: 500000 },
                        ),
                      );
                    }}
                    type={hasEnoughSignatures ? "primary" : "secondary"}
                  >
                    Exec
                  </Button>
                </TransactionListItem>
              </div>
            );
          }}
        />
      </div>
      <div>Pool page!</div>
      {/* <div>local provider is : {localProvider}</div>
      <div>read contract is : {}</div> */}
    </div>
  );
}
