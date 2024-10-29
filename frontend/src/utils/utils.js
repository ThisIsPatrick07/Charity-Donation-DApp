const { ethers } = require("ethers");

const toEther = (n) => Number(n) / (10 ** 18);
const toWei = (n) => ethers.parseUnits(n.toString(), "ether");

module.exports = {
	toEther,
	toWei,
}