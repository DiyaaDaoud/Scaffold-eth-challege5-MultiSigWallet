// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");
const { verify } = require("../utils/verify");
const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deploy("MyMultiSigWallet", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [
      chainId,
      [
        "0x012ed3d36047eE3576DA7C8c90CEAC099526EFa6",
        "0x0334424AB21F2e4D72AA7e6A0BA12cC7cFab1295",
        "0xf5fff32cf83a1a614e15f25ce55b0c0a6b5f8f2c",
      ],
      2,
    ],
    log: true,
    waitConfirmations: 5,
  });

  // Getting a previously deployed contract
  const myMultiSigWallet = await ethers.getContract(
    "MyMultiSigWallet",
    deployer
  );
  /*  await YourContract.setPurpose("Hello");
  
    To take ownership of yourContract using the ownable library uncomment next line and add the 
    address you want to be the owner. 
    // yourContract.transferOwnership(YOUR_ADDRESS_HERE);

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */

  // Verify your contracts with Etherscan
  // You don't want to verify on localhost
  try {
    if (chainId !== localChainId) {
      await verify(myMultiSigWallet.address, [
        chainId,
        [
          "0x012ed3d36047eE3576DA7C8c90CEAC099526EFa6",
          "0x0334424AB21F2e4D72AA7e6A0BA12cC7cFab1295",
          "0xf5fff32cf83a1a614e15f25ce55b0c0a6b5f8f2c",
        ],
        2,
      ]);
      console.log("VERIFIIIEEEEDD!!");
    }
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(error);
    }
  }
};
module.exports.tags = ["MyMultiSigWallet"];
