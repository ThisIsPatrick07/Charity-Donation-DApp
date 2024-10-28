import React, { useEffect } from 'react'
import { ethers } from "ethers";

function NavBar({ account, setAccount }) {

	async function connectionHandler(){
		const accounts = await window.ethereum.request({ method : "eth_requestAccounts" });
		const account = ethers.getAddress(accounts[0]);
		setAccount(account);
	}

	return (
		<nav className="nav__brand ">
			{account ? (
				<button className="connect-btn">
					{account.slice(0, 6) + "..." + account.slice(account.length-4)}
				</button>
			) : (
				<button 
					className="connect-btn"
					onClick={connectionHandler}
				>
					Connect
				</button>
			)}
		</nav>
	)
}

export default NavBar