const hre = require("hardhat");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

async function main(){

}

main().catch((error) => {
	console.log(error);
	process.exitCode = 1;
})