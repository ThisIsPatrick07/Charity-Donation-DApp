import NavBar from "./components/Navigation";

import CharityABI from "./abi/Charity.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import config from "./config.json";

import items from "./items.json";

function App() {
	const [beneficiaries, setBeneficiaries] = useState([]);
	const [donators, setDonators] = useState([]);
	
	const [account, setAccount] = useState(null);

	const [charity, setCharity] = useState(null);
	const [provider, setProvider] = useState(null);

	async function loadBlockchainData(){
		const provider = new ethers.BrowserProvider(window.ethereum);
		setProvider(provider);

		const network = await provider.getNetwork();
		console.log(network);

		const charity = new ethers.Contract(config[network.chainId].charity.address, CharityABI, provider);
		setCharity(charity);

		const tmpBeneficiaries = [];
		for(let i = 0; i < items["beneficiaries"].length; i++){
			const beneficiary = await charity.beneficiaries(i);
			tmpBeneficiaries.push(beneficiary);
		}
		setBeneficiaries(tmpBeneficiaries);

		const tmpDonators = [];
		for(let i = 0; i < items["donators"].length; i++){
			const donator = await charity.donators(i);
			tmpDonators.push(donator);
		}
		setDonators(tmpDonators);

		window.ethereum.on("accountsChanged", async () => {
			const accounts = await window.ethereum.request({ method : "eth_requestAccounts" });
			const account = ethers.getAddress(accounts[0]);
			setAccount(account);
		});
	}

	useEffect(() => {
		loadBlockchainData();
	}, []);

	return (
		<div>
			<NavBar account={account} setAccount={setAccount} />
		</div>
	);
}

export default App;
