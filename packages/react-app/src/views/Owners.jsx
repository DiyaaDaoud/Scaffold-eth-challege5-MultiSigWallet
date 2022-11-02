import { List, Select, Input, Button, Spin } from "antd";
import { Address, AddressInput } from "../components";
import { useLocalStorage } from "../hooks";
import { useHistory } from "react-router-dom";
import { useEffect } from "react";
const { Option } = Select;

export default function Owners({
  signaturesRequired,
  ownerEvents,
  mainnetProvider,
  blockExplorer,
  readContracts,
  contractName,
}) {
  const [methodName, setMethodName] = useLocalStorage("addSigner");
  const [newOwner, setNewOwner] = useLocalStorage("newOwner");
  const [newSignaturesRequired, setNewSignaturesRequired] = useLocalStorage("newSignaturesRequired");
  const [data, setData] = useLocalStorage("data", "0x");
  const [amount, setAmount] = useLocalStorage("amount", "0");
  const [to, setTo] = useLocalStorage("to");
  const history = useHistory();
  console.log("******* Owner events are: ", ownerEvents);
  let activeOwners = [];
  let u = 0;
  for (let i = 0; i < ownerEvents.length; i++) {
    let tempOwner = ownerEvents[i].owner;
    let tempOwnerCount = 0;
    for (let j = 0; j < ownerEvents.length; j++) {
      if (ownerEvents[j].owner == tempOwner) {
        tempOwnerCount = tempOwnerCount + 1;
      }
    }
    if (tempOwnerCount % 2 == 1) {
      activeOwners[u] = ownerEvents[i].owner;
      u = u + 1;
    }
  }
  console.log("*******active Owners are : ", activeOwners);

  return (
    <div>
      <h2 style={{ marginTop: 32 }}>
        Signatures Required : {signaturesRequired ? signaturesRequired.toNumber() : <Spin></Spin>}
      </h2>
      <List
        header={<b>Active Owners</b>}
        style={{ maxWidth: 400, margin: "auto", marginTop: 32, textAlign: "center" }}
        bordered
        dataSource={activeOwners}
        renderItem={item => {
          return (
            <List.Item key={"owner_" + item} style={{ textAlign: "center" }}>
              <Address
                address={item}
                ensProvider={mainnetProvider}
                blockExplorer={blockExplorer}
                fontSize={32}
              ></Address>
            </List.Item>
          );
        }}
      ></List>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <div style={{ margin: 8, padding: 8 }}>
          <Select style={{ width: "100%" }} value={methodName} onChange={setMethodName}>
            <Option key="addSigner">add Signer</Option>
            <Option key="removeSigner">remove Signer</Option>
          </Select>
        </div>
        <div style={{ margin: 8, padding: 8 }}>
          <AddressInput
            placeholder="enter the address"
            // value={newOwner}
            onChange={setNewOwner}
            ensProvider={mainnetProvider}
            autoFocus
          ></AddressInput>
        </div>
        <div style={{ margin: 8, padding: 8 }}>
          <Input
            id="SigNum"
            ensProvider={mainnetProvider}
            placeholder="new # of signatures required"
            onChange={e => {
              setNewSignaturesRequired(e.target.value);
            }}
          />
        </div>
        <div style={{ margin: 8, padding: 8 }}>
          <Button
            onClick={() => {
              console.log("METHOD", setMethodName);
              let calldata = readContracts[contractName].interface.encodeFunctionData(methodName, [
                newOwner,
                newSignaturesRequired,
              ]);
              console.log("calldata", calldata);
              setData(calldata);
              setAmount("0");
              setTo(readContracts[contractName].address);
              setTimeout(() => {
                history.push("/create");
              }, 777);
            }}
          >
            Create Tx
          </Button>
        </div>
      </div>
    </div>
  );
}
