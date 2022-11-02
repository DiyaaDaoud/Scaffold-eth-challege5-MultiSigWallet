import { useHistory } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { useRef, useState, useEffect } from "react";
import { Address, Blockie, Balance, AddressInput, EtherInput } from "../components";
import { Input, Spin, Select, Button } from "antd";
import { parseEther, formatEther } from "@ethersproject/units";
const { ethers } = require("ethers");
// import { useLocalStorage } from "../hooks";
const axios = require("axios");

export default function Create({
  readContracts,
  contractName,
  mainnetProvider,
  localProvider,
  price,
  userProvider,
  userSigner,
  address,
  gun,
}) {
  const history = useHistory();
  const nonce = useContractReader(readContracts, contractName, "nonce");
  const calldataInputRef = useRef("0x00");
  const [methodName, setMethodName] = useState();
  const [to, setTo] = useLocalStorage("to");
  const [selectDisabled, setSelectDisabled] = useState(false);
  const [decodedDataState, setDecodedData] = useState();
  const [data, setData] = useLocalStorage("data", "0x00");
  const [isCreateTxnEnabled, setCreateTxnEnabled] = useState(true);
  const [result, setResult] = useState();
  let decodedData = "";
  const [customNonce, setCustomNonce] = useState();
  const [amount, setAmount] = useLocalStorage("amount", "0");

  let decodedDataObject = "";

  const inputStyle = {
    padding: 10,
  };

  useEffect(() => {
    const inputTimer = setTimeout(async () => {
      console.log("EFFECT RUNNING");
      try {
        if (decodedDataObject.signature === "addSigner(address,uint256)") {
          setMethodName("addSigner");
          setSelectDisabled(true);
        } else if (decodedDataObject.signature === "removeSigner(address,uint256)") {
          setMethodName("removeSigner");
          setSelectDisabled(true);
        }
        decodedData = (
          <div>
            <div>
              {decodedDataObject && decodedDataObject.signature && <b>Function Signature : </b>}
              {decodedDataObject.signature}
            </div>
            {decodedDataObject.functionFragment &&
              decodedDataObject.functionFragment.inputs.map((element, index) => {
                if (element.type === "address") {
                  return (
                    <div
                      style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "left" }}
                    >
                      <b>{element.name} :&nbsp;</b>
                      <Address fontSize={16} address={decodedDataObject.args[index]} ensProvider={mainnetProvider} />
                    </div>
                  );
                }
                if (element.type === "uint256") {
                  return (
                    <p style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "left" }}>
                      {element.name === "value" ? (
                        <>
                          <b>{element.name} : </b>
                          <Balance fontSize={16} balance={decodedDataObject.args[index]} dollarMultiplier={price} />
                        </>
                      ) : (
                        <>
                          <b>{element.name} : </b>{" "}
                          {decodedDataObject.args[index] && decodedDataObject.args[index].toNumber()}
                        </>
                      )}
                    </p>
                  );
                }
              })}
          </div>
        );
        setDecodedData(decodedData);
        setCreateTxnEnabled(true);
        setResult();
      } catch (e) {
        console.log("mistake: ", e);
        if (data !== "0x") setResult("ERROR: Invalid calldata");
        setCreateTxnEnabled(false);
      }
    }, 500);
    return () => {
      clearTimeout(inputTimer);
    };
  }, [data, decodedData, amount]);
  let resultDisplay;
  if (result) {
    if (result.indexOf("ERROR") >= 0) {
      resultDisplay = <div style={{ margin: 16, padding: 8, color: "red" }}>{result}</div>;
    } else {
      resultDisplay = (
        <div style={{ margin: 16, padding: 8 }}>
          <Blockie size={4} scale={8} address={result} /> Tx {result.substr(0, 6)} Created!
          <div style={{ margin: 8, padding: 4 }}>
            <Spin />
          </div>
        </div>
      );
    }
  }
  return (
    <div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <div style={{ margin: 8 }}>
          <div style={inputStyle}>
            <Input
              prefix="#"
              disabled
              value={customNonce}
              placeholder={"" + (nonce ? nonce.toNumber() : "loading...")}
              onChange={setCustomNonce}
            />
          </div>
          <div style={{ margin: 8, padding: 8 }}>
            <Select value={methodName} disabled={selectDisabled} style={{ width: "100%" }} onChange={setMethodName}>
              {/* <Option key="transferFunds">transferFunds()</Option> */}
              <Option disabled={true} key="addSigner">
                add Signer
              </Option>
              <Option disabled={true} key="removeSigner">
                remove Signer
              </Option>
              <Option key="transferFunds">Transfer ETH</Option>
              <Option key="custom">Custom Call Data</Option>
            </Select>
          </div>
          <div style={inputStyle}>
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder="to address"
              value={to}
              onChange={setTo}
            />
          </div>
          {!selectDisabled && (
            <div style={inputStyle}>
              <EtherInput price={price} mode="USD" value={amount} onChange={setAmount} />
            </div>
          )}
          {methodName != "transferFunds" && (
            <div style={inputStyle}>
              <Input
                placeholder="calldata"
                onChange={e => {
                  setData(e.target.value);
                }}
                ref={calldataInputRef}
              />
              {decodedDataState}
            </div>
          )}
          <Button
            style={{ marginTop: 32 }}
            disabled={!isCreateTxnEnabled}
            onClick={async () => {
              const nonce = customNonce || (await readContracts[contractName].nonce());
              console.log("creating Tx:" + methodName + " " + to + " amount" + amount + " data" + data);
              const newHash = await readContracts[contractName].getTranscationHash(
                to,
                nonce,
                parseEther("" + parseFloat(amount).toFixed(12)),
                data,
              );
              console.log("Create Page: new Hash is : ", newHash);
              const signature = await userSigner.signMessage(ethers.utils.arrayify(newHash));
              console.log("Create Page: signature is : ", signature);
              const recover = await readContracts[contractName].recover(newHash, signature);
              console.log("Create Page: revovered address is : ", recover);
              const isOwner = await readContracts[contractName].isOwner(recover);
              if (isOwner) {
                const newTx = gun.get(newHash).put({
                  chainId: localProvider._network.chainId,
                  address: readContracts[contractName].address,
                  nonce: nonce.toNumber(),
                  to,
                  amount,
                  data,
                  hash: newHash,
                  signatures: signature,
                  signers: recover,
                });
                console.log("Create Page: new Tx  : ", newTx);
                gun.get(readContracts[contractName].address + "_" + localProvider._network.chainId).set(newTx);
                newTx.once(data => {
                  console.log("RESULT", data);
                });
                setTimeout(() => {
                  history.push("/pool");
                }, 2777);
                newTx.once(data => {
                  setResult(data.hash);
                });
                setTo();
                setAmount("0");
                setData("0x");
              } else {
                // console.log("ERROR, NOT OWNER.");
                setResult("ERROR, NOT OWNER.");
              }
            }}
          >
            Create
          </Button>
        </div>
        {resultDisplay}
      </div>
    </div>
  );
}

function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = value => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
