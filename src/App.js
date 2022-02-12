import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
	const contractAddress = "0x35A644F750B0B48712ea850ed323D3Ab494eaFbf";
	const contractABI = abi.abi;

	const [currentAccount, setCurrentAccount] = useState("");
	const [message, setMessage] = useState();
	const [allWaves, setAllWaves] = useState([]);
	const [wavesCount, setWavesCount] = useState("??");

	const checkIfWalletIsConnected = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log("Make sure you have metamask!");
				return;
			} else {
				console.log("We have the ethereum object", ethereum);
			}

			//Check if we access to an authorized account
			const accounts = await ethereum.request({ method: "eth_accounts" });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log("Found an authorized account:", account);
				setCurrentAccount(account);
			} else {
				console.log("No authorized account found");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const getAllWaves = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				//call the getAllWaves method of the smart contract
				const waves = await wavePortalContract.getAllWaves();

				const wavesCleaned = waves.map((wave) => {
					return {
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					};
				});
				setAllWaves(wavesCleaned);
			} else {
				console.log("Ethereum object doesn't exist");
			}
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log("NewWave", from, timestamp, message);
			setAllWaves((prevState) => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message,
				},
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer
			);
			wavePortalContract.on("NewWave", onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off("NewWave", onNewWave);
			}
		};
	}, []);

	const wave = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();

				//using contractABI here(artifact)
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				let count = await wavePortalContract.getTotalWaves();
				setWavesCount(count.toNumber());
				console.log("Retrieved total wave count...", count.toNumber());

				const waveTxn = await wavePortalContract.wave(message, {
					gasLimit: 300000,
				});
				console.log(`Mining... ${waveTxn.hash}`);

				await waveTxn.wait();
				console.log(`Mined -- ${waveTxn.hash}`);

				count = await wavePortalContract.getTotalWaves();
				setWavesCount(count.toNumber());
				console.log("Retrieved total wave count...", count.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask!");
				return;
			}

			const accounts = await ethereum.request({
				method: "eth_requestAccounts",
			});

			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	return (
		<div className='mainContainer'>
			<div className='dataContainer'>
				<div className='header'>
					<span role='img' aria-label='wave'>
						👋
					</span>{" "}
					Hello there!
				</div>

				<div className='bio'>
					I'm <b>Kevin</b> and I've work how to backend developer
					<br />
					Connect your Ethereum wallet and try waving at me! Maybe you get
					to earn some <b>Ξ</b>
				</div>
				{currentAccount && (
					<div className='card'>
						<div className='card-inner'>
							<label>Send a Wave </label>
							<div className='container'>
								<div className='input-container'>
									<input
										onChange={(e) => setMessage(e.target.value)}
										placeholder='The taughts you want to share'
									/>
								</div>
								<button className='send' onClick={wave}></button>
							</div>
						</div>
					</div>
				)}

				{!currentAccount && (
					<button className='waveButton' onClick={connectWallet}>
						Connect Wallet
					</button>
				)}
				{currentAccount && (
					<div className='totalScore'>Total Waves: {wavesCount}</div>
				)}
				{allWaves.map((wave, index) => {
					return (
						<div key={index} className='card'>
							<div className='card-inner'>
								<div>
									<span className='addy'>{wave.address}</span>
									{wave.winner ? "🏆" : ""}
									<p style={{ color: "#ffb86c" }}>{wave.message}</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default App;
