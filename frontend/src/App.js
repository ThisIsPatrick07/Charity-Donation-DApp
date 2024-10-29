import NavBar from "./components/Navigation";

import CharityABI from "./abi/Charity.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import config from "./config.json";

import items from "./items.json";
import BeneficiaryList from "./components/BeneficiaryList";
import Payment from "./components/Payment";

/** General info.
 * 
 * Donators
 * -------------
 * bob: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
 * damian: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
 * 
 * Beneficiaries
 * ----------------
 * alice: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
 * charlie: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
 */

function App() {
	const [beneficiaries, setBeneficiaries] = useState([]);
	const [donators, setDonators] = useState([]);
	
	const [account, setAccount] = useState(null);
	const [charity, setCharity] = useState(null);
	const [provider, setProvider] = useState(null);

	const [currentBenef, setCurrentBenef] = useState(null);
	const [toggle, setToggle] = useState(false);

	async function loadBlockchainData(){
		const provider = new ethers.BrowserProvider(window.ethereum);
		setProvider(provider);

		const network = await provider.getNetwork();
		console.log(config[network.chainId]);

		const charity = new ethers.Contract(config[network.chainId].charity.address, CharityABI, provider);
		setCharity(charity);

		const tmpBeneficiaries = [];
		for(let i = 0; i < items["beneficiaries"].length; i++){
			// const beneficiary = items["beneficiaries"][i];
			let beneficiary = await charity.beneficiaries(i);

			beneficiary = {
				id : beneficiary[0],
				name: beneficiary[1],
				beneficiaryAddress: beneficiary[2],
				targetAmount: beneficiary[3],
				collectedAmount: beneficiary[4],
				currentAmount: beneficiary[5],
			};
			tmpBeneficiaries.push(beneficiary);
		}
		setBeneficiaries(tmpBeneficiaries);

		const tmpDonators = [];
		for(let i = 0; i < items["donators"].length; i++){
			let donator = await charity.donators(i);
			
			donator = {
				id: donator[0],
				name: donator[1],
				donatorAddress: donator[2],
			};
			tmpDonators.push(donator);
		}
		setDonators(tmpDonators);
		
		console.log(await charity.donators(0));

		window.ethereum.on("accountsChanged", async () => {
			const accounts = await window.ethereum.request({ method : "eth_requestAccounts" });
			const account = ethers.getAddress(accounts[0]);
			setAccount(account);
		});
	}

	function togglePop(benef){
		setCurrentBenef(benef);
		toggle ? setToggle(false) : setToggle(true);
	}

	useEffect(() => {
		loadBlockchainData();
	}, []);

	// console.log(donators[0].donatorAddress, donators[1].donatorAddress);
	// console.log(beneficiaries[0].beneficiaryAddress, beneficiaries[1].beneficiaryAddress);

	return (
		<div>
			<NavBar 
				account={account} 
				setAccount={setAccount} 
			/>

			<BeneficiaryList 
				beneficiaries={beneficiaries} 
				account={account} 

				togglePop={togglePop} 
			/>

			{toggle && (
				<Payment 
					currentBenef={currentBenef} 
					provider={provider}
					charity={charity}
					loadBlockchainData={loadBlockchainData}

					togglePop={togglePop} 
				/>
			)}
		</div>
	);
}

export default App;
