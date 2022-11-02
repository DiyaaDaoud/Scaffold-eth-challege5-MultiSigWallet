import { Balance, Address, TransactionListItem, Blockie } from "../components";
import QR from "qrcode.react";
import { List } from "antd";
export default function FrontPage({
  executeTransactionEvents,
  readContracts,
  contractName,
  localProvider,
  price,
  mainnetProvider,
  blockExplorer,
}) {
  console.log("our contract", readContracts[contractName]);
  console.log("Front page: execute tx events: ", executeTransactionEvents);
  return (
    <div style={{ maxWidth: 1000, margin: "auto", marginTop: 32, marginBottom: 32 }}>
      <div style={{ paddingBottom: 32 }}>
        <div>
          <Balance
            address={readContracts[contractName] ? readContracts[contractName].address : ""}
            provider={localProvider}
            dollarMultiplier={price}
            fontSize={64}
          />
        </div>
        <div>
          <QR
            value={readContracts[contractName] ? readContracts[contractName].address : ""}
            size="180"
            level="H"
            includeMargin
            renderAs="svg"
            imageSettings={{ excavate: false }}
          />
        </div>
        <div>
          <Address
            address={readContracts[contractName] ? readContracts[contractName].address : ""}
            ensProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            fontSize={32}
          />
        </div>
      </div>
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
            </tr>
          </table>
        }
        dataSource={executeTransactionEvents}
        bordered
        renderItem={item => {
          return (
            <TransactionListItem
              item={item}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              price={price}
              readContracts={readContracts}
              contractName={contractName}
            ></TransactionListItem>
          );
        }}
      ></List>
    </div>
  );
}
