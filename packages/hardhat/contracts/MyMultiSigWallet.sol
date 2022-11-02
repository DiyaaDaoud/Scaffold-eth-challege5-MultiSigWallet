pragma solidity >=0.8.0 <0.9.0;

//SPDX-License-Identifier: MIT

// import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MyMultiSigWallet {
    //libraries
    using ECDSA for bytes32;

    // public variables
    uint256 public signaturesRequired;
    mapping(address => bool) public isOwner;
    uint256 public nonce;
    uint256 public chainId;

    // events
    event Owner(address indexed owner, bool isAdded);
    event TransactionExecuted(
        address indexed from,
        address payable to,
        uint256 value,
        bytes data,
        uint256 nonce,
        bytes32 hash,
        bytes result
    );
    event Deposit(address indexed from, uint256 amount, uint256 balance);

    constructor(
        uint256 _chainId,
        address[] memory _owners,
        uint256 _signatruesRequired
    ) payable {
        require(
            _signatruesRequired > 0,
            "Constructor: number of Signatures required must be > 0!"
        );
        signaturesRequired = _signatruesRequired;
        chainId = _chainId;
        for (uint256 i = 0; i < _owners.length; i++) {
            require(
                _owners[i] != address(0),
                "Constructor: zero address can't be an owner!"
            );
            require(!isOwner[_owners[i]], "Constructor: duplicated address!");
            isOwner[_owners[i]] = true;
            emit Owner(_owners[i], isOwner[_owners[i]]);
        }
    }

    modifier onlySelf() {
        require(
            msg.sender == address(this),
            "onlySelf: transaction must be made by the contract itself!"
        );
        _;
    }

    function addSigner(address newSigner, uint256 newSignaturesRequired)
        public
        onlySelf
    {
        // require(isOwner[msg.sender], "addSigner: only owner can add signers!");
        require(
            !isOwner[newSigner],
            "addSigner: this address is alreay an owner!"
        );
        require(
            newSigner != address(0),
            "addSigner: zero address can't be an owner!"
        );
        require(
            newSignaturesRequired > 0,
            "addSigner: number of Signatures required must be > 0!"
        );
        signaturesRequired = newSignaturesRequired;
        isOwner[newSigner] = true;
        emit Owner(newSigner, isOwner[newSigner]);
    }

    function removeSigner(address oldSigner, uint256 newSignaturesRequired)
        public
        onlySelf
    {
        // require(
        //     isOwner[msg.sender],
        //     "removeSigner: only owner can remove signers!"
        // );
        require(
            isOwner[oldSigner],
            "removeSigner: this address is not an owner!"
        );

        require(
            newSignaturesRequired > 0,
            "removeSigner: number of Signatures required must be > 0!"
        );
        signaturesRequired = newSignaturesRequired;
        isOwner[oldSigner] = false;
        emit Owner(oldSigner, isOwner[oldSigner]);
    }

    function updateRequiredSignatures(uint256 newSignaturesRequired)
        public
        onlySelf
    {
        require(
            newSignaturesRequired > 0,
            "updateRequiredSignatures: number of Signatures required must be > 0!"
        );
        signaturesRequired = newSignaturesRequired;
    }

    function executeTransaction(
        address payable _to,
        uint256 _value,
        bytes memory _data,
        bytes[] memory _signatures
    ) public returns (bytes memory) {
        require(
            isOwner[msg.sender],
            "executeTransaction: only an owner can execute transactions!"
        );
        bytes32 _hash = getTranscationHash(_to, nonce, _value, _data);
        nonce++;
        address duplicateGuard;
        uint256 validSignatures = 0;
        for (uint256 i = 0; i < _signatures.length; i++) {
            address recovered = recover(_hash, _signatures[i]);
            require(
                recovered > duplicateGuard,
                "executeTransaction: unordered or duplicated signatures!"
            );
            duplicateGuard = recovered;
            if (isOwner[recovered]) {
                validSignatures++;
            }
        }
        require(
            validSignatures >= signaturesRequired,
            "executeTransaction: not enough valid signatures!"
        );
        (bool success, bytes memory result) = _to.call{value: _value}(_data);
        require(success, "executeTransaction: transaction execution failed!");
        emit TransactionExecuted(
            msg.sender,
            _to,
            _value,
            _data,
            nonce - 1,
            _hash,
            result
        );
        return result;
    }

    function getTranscationHash(
        address to,
        uint256 _nonce,
        uint256 value,
        bytes memory data
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    address(this),
                    chainId,
                    _nonce,
                    to,
                    value,
                    data
                )
            );
    }

    function recover(bytes32 _hash, bytes memory _signature)
        public
        pure
        returns (address)
    {
        return _hash.toEthSignedMessageHash().recover(_signature);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    fallback() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
}
