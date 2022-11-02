import React, { useState } from "react";
import { Button, List } from "antd";

import { Address, Balance, Blockie, TransactionDetailsModal } from "../components";
import { EllipsisOutlined } from "@ant-design/icons";
import { parseEther, formatEther } from "@ethersproject/units";

const TransactionListItem = function ({
  item,
  mainnetProvider,
  blockExplorer,
  price,
  readContracts,
  contractName,
  children,
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [txnInfo, setTxnInfo] = useState(null);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const buildTxnTransferData = transaction => {
    return {
      functionFragment: {
        inputs: [],
        name: "Transfer",
      },
      signature: "",
      args: [transaction.to],
      sighash: item.data,
    };
  };

  console.log("🔥🔥🔥🔥", item);
  let txnData;
  try {
    txnData =
      item.data === "" || item.data === "0x" || item.data === "0x00"
        ? buildTxnTransferData(item)
        : readContracts[contractName].interface.parseTransaction(item);
  } catch (error) {
    console.log("ERROR", error);
  }
  let from = item.signers ? item.signers.split(",")[item.signers.split(",").length - 1] : item[0];
  console.log("item.signers.split(", ").length - 1 is : ", from);
  console.log("txnData is :", txnData);
  return (
    <>
      <TransactionDetailsModal
        visible={isModalVisible}
        txnInfo={txnData}
        handleOk={handleOk}
        mainnetProvider={mainnetProvider}
        price={price}
      />
      {txnData && (
        <List.Item key={item.hash} style={{ position: "relative" }}>
          <table>
            <tr>
              <th style={{ width: 50 }}>
                {<b style={{ padding: 16 }}>#{typeof item.nonce === "number" ? item.nonce : item.nonce.toNumber()}</b>}
              </th>
              <th style={{ width: 175 }}>
                <span style={{ paddingLeft: 0 }}>{txnData.functionFragment.name};</span>
              </th>
              <th style={{ width: 175 }}>
                <Address
                  address={txnData.args[0]}
                  ensProvider={mainnetProvider}
                  blockExplorer={blockExplorer}
                  fontSize={16}
                />
              </th>
              <th style={{ width: 125 }}>
                <span>
                  <Blockie size={4} scale={8} address={item.hash} /> {item.hash.substr(0, 6)}
                </span>
              </th>
              <th style={{ width: 125 }}>
                <Address address={from} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
              </th>
              <th style={{ width: 75 }}>
                <Balance
                  balance={item.value ? item.value : parseEther("" + parseFloat(item.amount).toFixed(12))}
                  dollarMultiplier={price}
                />
              </th>
            </tr>
          </table>
          <>{children}</>

          <Button onClick={showModal}>
            <EllipsisOutlined />
          </Button>
        </List.Item>
      )}
    </>
  );
};
export default TransactionListItem;
