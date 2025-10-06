let selectedNetwork = null;
let provider, signer, factoryContract, account;

const planet = document.querySelector('.planet');
let lastScrollTop = 0;
let rotation = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const scrollDelta = scrollTop - lastScrollTop;
    rotation += scrollDelta * 0.05; // Adjust rotation speed as needed
    planet.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    lastScrollTop = scrollTop;
});
const networkConfig = {
    cronos: {
        chainId: '0x19',
        factoryAddress: "0x757a1338117eb12273bf97e07D0344Fd073F89b7",
        rpcUrl: "https://evm.cronos.org",
        usdcAddress: "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59"
    },
    polygon: {
        chainId: '0x89',
        factoryAddress: "0x0B9ad210e1c51465C8f450dD75CA1A5c0024A077",
        rpcUrl: "https://polygon-rpc.com",
        usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
    }
};

const factoryABI = [
    "event PoolCreated(address indexed pool, address indexed owner, address nft, address rewardToken, string name)",
    "function createPool(address nft, address rewardToken, uint256 startTime, uint256 endTime, uint256 totalRewards, string name) external returns (address)",
    "function getPools() external view returns (address[])",
    "function withdrawNative(uint256 amount) external",
    "function withdrawUSDC(uint256 amount) external",
    "function openFee() external view returns (uint256)",
    "function txFee() external view returns (uint256)",
    "function setOpenFee(uint256 fee) external",
    "function setTxFee(uint256 fee) external",
    "function setExempt(address account, bool status) external",
    "function owner() external view returns (address)"
];

const poolABI = [
    "function stake(uint256[] tokenIds) external payable",
    "function unstake(uint256[] tokenIds) external payable",
    "function claim(uint256[] tokenIds) external payable",
    "function addRewards(uint256 amount) external payable",
    "function withdrawExcessRewards(uint256 amount) external payable",
    "function setEndTime(uint256 newEnd) external payable",
    "function setRewardTokenName(string newName) external payable",
    "function setBonusNFT(address bonusNFT) external payable",
    "function stakeBonus(uint256[] tokenIds) external payable",
    "function unstakeBonus(uint256[] tokenIds) external payable",
    "function endPoolNow() external",
    "function withdrawRemaining() external",
    "function offChainStake(uint256 tokenId, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable",
    "function nonces(address account) external view returns (uint256)",
    "function getUserStakedTokens(address user) external view returns (uint256[])",
    "function earned(address account) external view returns (uint256)",
    "function nft() external view returns (address)",
    "function rewardToken() external view returns (address)",
    "function name() external view returns (string)",
    "function rewardTokenName() external view returns (string)",
    "function bonusNFT() external view returns (address)",
    "function owner() external view returns (address)",
    "function startTime() external view returns (uint256)",
    "function endTime() external view returns (uint256)",
    "function totalRewards() external view returns (uint256)",
    "function txFee() view returns (uint256)",
    "function getUserBonusStakedTokens(address) view returns (uint256[])",
    "function getUserMultiplier(address) view returns (uint256)",
    "function stakedBy(uint256 tokenId) view returns (address)",
    // New functions added to ABI
    "function setNFT(address newNFT) external payable",
    "function setRewardToken(address newRewardToken) external payable"
];

const erc721ABI = [
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function name() view returns (string)",
    "function supportsInterface(bytes4 interfaceId) view returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function setApprovalForAll(address operator, bool approved) external",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const imageStorage = {};

function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        starsContainer.appendChild(star);
    }
}

async function getUsdcDecimals() {
    try {
        const usdcContract = new ethers.Contract(networkConfig[selectedNetwork].usdcAddress, erc20ABI, provider);
        return await usdcContract.decimals();
    } catch (error) {
        console.warn(`Error fetching USDC decimals: ${error.message}. Defaulting to 6.`);
        return 6;
    }
}

async function getDefaultNFTImage(nftAddr) {
    try {
        const nftContract = new ethers.Contract(nftAddr, erc721ABI, provider);
        const isERC721 = await nftContract.supportsInterface("0x80ac58cd");
        if (!isERC721) return 'https://placehold.co/100x100';
        let tokenURI;
        try {
            tokenURI = await nftContract.tokenURI(1);
            if (!tokenURI || (!tokenURI.startsWith("http") && !tokenURI.startsWith("ipfs://"))) {
                throw new Error("Invalid tokenURI");
            }
        } catch (e) {
            console.warn(`Failed to load tokenURI for token 1 at ${nftAddr}: ${e.message}`);
            return 'https://placehold.co/100x100';
        }
        try {
            const metadataRes = await fetch(
                tokenURI.startsWith("ipfs://")
                    ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
                    : tokenURI
            );
            const metadata = await metadataRes.json();
            return metadata.image.startsWith("ipfs://")
                ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
                : metadata.image;
        } catch (e) {
            console.warn(`Failed to fetch metadata for token 1 at ${nftAddr}: ${e.message}`);
            return 'https://placehold.co/100x100';
        }
    } catch (e) {
        console.warn(`Error fetching default NFT image for ${nftAddr}: ${e.message}`);
        return 'https://placehold.co/100x100';
    }
}

function isValidAddress(address) {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
}

async function switchNetwork(network) {
    if (!window.ethereum) {
        displayError("walletStatus", "Please install MetaMask");
        return;
    }
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkConfig[network].chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: networkConfig[network].chainId,
                            chainName: network.charAt(0).toUpperCase() + network.slice(1),
                            rpcUrls: [networkConfig[network].rpcUrl],
                            nativeCurrency: {
                                name: network === 'cronos' ? 'Cronos' : 'MATIC',
                                symbol: network === 'cronos' ? 'CRO' : 'MATIC',
                                decimals: 18,
                            },
                            blockExplorerUrls: [network === 'cronos' ? 'https://cronosscan.com' : 'https://polygonscan.com'],
                        },
                    ],
                });
            } catch (addError) {
                displayError("walletStatus", `Error adding network: ${addError.message}`);
            }
        } else {
            displayError("walletStatus", `Error switching network: ${switchError.message}`);
        }
    }
}

function displayError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = message;
        element.className = "status error";
    }
}

function displaySuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = message;
        element.className = "status success";
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        displayError("walletStatus", "Please install MetaMask");
        return;
    }
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        account = await signer.getAddress();
        displaySuccess("walletStatus", `Connected: ${account}`);
        const walletAddress = document.getElementById("walletAddress");
        if (walletAddress) walletAddress.innerText = `Wallet Address: ${account}`;
        factoryContract = new ethers.Contract(networkConfig[selectedNetwork].factoryAddress, factoryABI, signer);

        const sections = ["deploySection", "stakeSection", "unstakeSection"];
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = "block";
        });

        let isPoolOwner = false;
        try {
            const pools = await factoryContract.getPools();
            for (const poolAddr of pools) {
                try {
                    const poolContract = new ethers.Contract(poolAddr, poolABI, provider);
                    const owner = await poolContract.owner();
                    if (owner.toLowerCase() === account.toLowerCase()) {
                        isPoolOwner = true;
                        break;
                    }
                } catch (e) {
                    console.warn(`Error checking owner for pool ${poolAddr}: ${e.message}`);
                }
            }
        } catch (error) {
            console.warn(`Error fetching pools for ownership check: ${error.message}`);
        }

        if (isPoolOwner) {
            const manageSections = ["manageSection", "endedPoolsSection"];
            manageSections.forEach(id => {
                const section = document.getElementById(id);
                if (section) section.style.display = "block";
            });
        }

        try {
            const factoryOwner = await factoryContract.owner();
            if (factoryOwner.toLowerCase() === account.toLowerCase()) {
                const adminSection = document.getElementById("adminSection");
                if (adminSection) adminSection.style.display = "block";
                await loadAdminData();
            }
        } catch (e) {
            console.warn(`Error checking factory owner: ${e.message}`);
        }

        await loadPools();
        await loadMyPools();
    } catch (error) {
        console.error('Connect wallet error:', error);
        displayError("walletStatus", `Error: ${error.message}`);
    }
}

function copyWallet() {
    if (!account) {
        displayError("walletStatus", "Wallet not connected");
        return;
    }
    navigator.clipboard.writeText(account).then(() => {
        displaySuccess("walletStatus", "Wallet address copied!");
    }).catch(err => {
        console.error('Copy wallet error:', err);
        displayError("walletStatus", `Error copying wallet address: ${err.message}`);
    });
}

async function loadAdminData() {
    const adminStatus = document.getElementById("adminStatus");
    if (!adminStatus) return;
    try {
        const usdcDecimals = await getUsdcDecimals();
        const openFee = await factoryContract.openFee();
        const txFee = await factoryContract.txFee();
        const nativeBalance = await provider.getBalance(factoryContract.target);
        const usdcContract = new ethers.Contract(networkConfig[selectedNetwork].usdcAddress, erc20ABI, provider);
        const usdcBalance = await usdcContract.balanceOf(factoryContract.target);

        const elements = {
            currentOpenFee: `Current Open Fee: ${ethers.formatUnits(openFee, usdcDecimals)} USDC`,
            currentTxFee: `Current Tx Fee: ${ethers.formatEther(txFee)} ${selectedNetwork === 'cronos' ? 'CRO' : 'MATIC'}`,
            nativeBalance: `Native Balance: ${ethers.formatEther(nativeBalance)} ${selectedNetwork === 'cronos' ? 'CRO' : 'MATIC'}`,
            usdcBalance: `USDC Balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)} USDC`,
            openFeeDisplay: `Pool Open Fee: ${ethers.formatUnits(openFee, usdcDecimals)} USDC`
        };
        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) element.innerText = text;
        });
    } catch (error) {
        console.error('Load admin data error:', error);
        displayError("adminStatus", `Error loading admin data: ${error.message}`);
    }
}

async function withdrawNativeAdmin() {
    const adminStatus = document.getElementById("adminStatus");
    if (!adminStatus) return;
    try {
        const amountInput = document.getElementById("withdrawNativeAmount");
        if (!amountInput) throw new Error("Withdraw amount input not found");
        const amount = ethers.parseEther(amountInput.value);
        if (amount <= 0) throw new Error("Invalid amount");
        const gasEstimate = await factoryContract.withdrawNative.estimateGas(amount);
        const tx = await factoryContract.withdrawNative(amount, { gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("adminStatus", "Native tokens withdrawn successfully!");
        await loadAdminData();
    } catch (error) {
        console.error('Withdraw native error:', error);
        displayError("adminStatus", `Error withdrawing native tokens: ${error.message}`);
    }
}

async function withdrawUsdcAdmin() {
    const adminStatus = document.getElementById("adminStatus");
    if (!adminStatus) return;
    try {
        const amountInput = document.getElementById("withdrawUsdcAmount");
        if (!amountInput) throw new Error("Withdraw USDC amount input not found");
        const usdcDecimals = await getUsdcDecimals();
        const amount = ethers.parseUnits(amountInput.value, usdcDecimals);
        if (amount <= 0) throw new Error("Invalid amount");
        const gasEstimate = await factoryContract.withdrawUSDC.estimateGas(amount);
        const tx = await factoryContract.withdrawUSDC(amount, { gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("adminStatus", "USDC withdrawn successfully!");
        await loadAdminData();
    } catch (error) {
        console.error('Withdraw USDC error:', error);
        displayError("adminStatus", `Error withdrawing USDC: ${error.message}`);
    }
}

async function setOpenFee() {
    const adminStatus = document.getElementById("adminStatus");
    if (!adminStatus) return;
    try {
        const newFeeInput = document.getElementById("newOpenFee");
        if (!newFeeInput) throw new Error("Open fee input not found");
        const usdcDecimals = await getUsdcDecimals();
        const newFee = ethers.parseUnits(newFeeInput.value, usdcDecimals);
        if (newFee < 0) throw new Error("Invalid fee");
        const gasEstimate = await factoryContract.setOpenFee.estimateGas(newFee);
        const tx = await factoryContract.setOpenFee(newFee, { gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("adminStatus", "Open fee set successfully!");
        await loadAdminData();
    } catch (error) {
        console.error('Set open fee error:', error);
        displayError("adminStatus", `Error setting open fee: ${error.message}`);
    }
}

async function setTxFee() {
    const adminStatus = document.getElementById("adminStatus");
    if (!adminStatus) return;
    try {
        const newFeeInput = document.getElementById("newTxFee");
        if (!newFeeInput) throw new Error("Transaction fee input not found");
        const newFee = ethers.parseEther(newFeeInput.value);
        if (newFee < 0) throw new Error("Invalid fee");
        const gasEstimate = await factoryContract.setTxFee.estimateGas(newFee);
        const tx = await factoryContract.setTxFee(newFee, { gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("adminStatus", "Transaction fee set successfully!");
        await loadAdminData();
    } catch (error) {
        console.error('Set tx fee error:', error);
        displayError("adminStatus", `Error setting transaction fee: ${error.message}`);
    }
}

async function setExempt() {
    const adminStatus = document.getElementById("adminStatus");
    if (!adminStatus) return;
    try {
        const addressInput = document.getElementById("exemptAddress");
        const statusInput = document.getElementById("exemptStatus");
        if (!addressInput || !statusInput) throw new Error("Exempt address or status input not found");
        const address = addressInput.value;
        const status = statusInput.value === "true";
        if (!isValidAddress(address)) throw new Error("Invalid address");
        const gasEstimate = await factoryContract.setExempt.estimateGas(address, status);
        const tx = await factoryContract.setExempt(address, status, { gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("adminStatus", `Address ${status ? 'exempted' : 'unexempted'} successfully!`);
    } catch (error) {
        console.error('Set exempt error:', error);
        displayError("adminStatus", `Error setting exempt status: ${error.message}`);
    }
}

async function loadPools() {
    const poolsDiv = document.getElementById("pools");
    const endedPoolsDiv = document.getElementById("endedPools");
    const select = document.getElementById("selectedPool");
    const manageSelect = document.getElementById("managePool");
    if (!poolsDiv || !endedPoolsDiv || !select || !manageSelect) {
        console.warn("One or more pool display elements not found");
        return;
    }
    try {
        const pools = await factoryContract.getPools();
        poolsDiv.innerHTML = pools.length === 0 ? "<p>No active pools available</p>" : "";
        endedPoolsDiv.innerHTML = "";
        select.innerHTML = '<option value="">Select a Pool</option>';
        manageSelect.innerHTML = '<option value="">Select a Pool</option>';
        const now = Math.floor(Date.now() / 1000);
        let activeCount = 0;
        let hasEndedPools = false;
        for (const poolAddr of pools) {
            try {
                const poolContract = new ethers.Contract(poolAddr, poolABI, provider);
                const owner = await poolContract.owner();
                const name = await poolContract.name();
                const startTime = await poolContract.startTime();
                const endTime = await poolContract.endTime();
                const totalRewards = await poolContract.totalRewards();
                const nftAddr = await poolContract.nft();
                const rewardTokenName = await poolContract.rewardTokenName();
                const startDate = new Date(Number(startTime) * 1000).toLocaleString();
                const endDate = new Date(Number(endTime) * 1000).toLocaleString();
                const rewardsFormatted = ethers.formatUnits(totalRewards, 18);
                const isEnded = Number(endTime) <= now;
                const isOwner = owner.toLowerCase() === account.toLowerCase();
                const targetDiv = isEnded ? endedPoolsDiv : poolsDiv;
                if (!isEnded) {
                    activeCount++;
                    targetDiv.innerHTML += `
                        <div class="pool-tile">
                            <img src="${imageStorage[poolAddr] || await getDefaultNFTImage(nftAddr)}" alt="${name}">
                            <div class="text-content">
                                <p><strong>${name}</strong></p>
                                <p>Reward Token: ${rewardTokenName}</p>
                                <p>Start: ${startDate}</p>
                                <p>End: ${endDate}</p>
                                <p>Rewards: ${rewardsFormatted}</p>
                            </div>
                        </div>`;
                    select.innerHTML += `<option value="${poolAddr}">${name}</option>`;
                } else if (isOwner) {
                    hasEndedPools = true;
                    targetDiv.innerHTML += `
                        <div class="pool-tile">
                            <img src="${imageStorage[poolAddr] || await getDefaultNFTImage(nftAddr)}" alt="${name}">
                            <div class="text-content">
                                <p><strong>${name}</strong></p>
                                <p>Reward Token: ${rewardTokenName}</p>
                                <p>Start: ${startDate}</p>
                                <p>End: ${endDate}</p>
                                <p>Rewards: ${rewardsFormatted}</p>
                                <p class="status-ended">Status: Ended</p>
                            </div>
                        </div>`;
                }
                if (isOwner) {
                    manageSelect.innerHTML += `<option value="${poolAddr}">${name}${isEnded ? ' (Ended)' : ''}</option>`;
                }
            } catch (e) {
                console.warn(`Error processing pool ${poolAddr}: ${e.message}`);
            }
        }
        if (poolsDiv.innerHTML === "") {
            poolsDiv.innerHTML = "<p>No active pools available</p>";
        }
        if (endedPoolsDiv.innerHTML === "") {
            endedPoolsDiv.innerHTML = "<p>No ended pools owned</p>";
        }
        const endedPoolsSection = document.getElementById("endedPoolsSection");
        if (endedPoolsSection) endedPoolsSection.style.display = hasEndedPools ? "block" : "none";
    } catch (error) {
        console.error('Load pools error:', error);
        poolsDiv.innerHTML = `<p class="error">Error loading pools: ${error.message}</p>`;
        endedPoolsDiv.innerHTML = `<p class="error">Error loading ended pools: ${error.message}</p>`;
    }
}

async function loadMyPools() {
    const myPoolsDiv = document.getElementById("myPools");
    if (!myPoolsDiv) return;
    try {
        const pools = await factoryContract.getPools();
        myPoolsDiv.innerHTML = "";
        const now = Math.floor(Date.now() / 1000);
        for (const poolAddr of pools) {
            try {
                const poolContract = new ethers.Contract(poolAddr, poolABI, provider);
                const owner = await poolContract.owner();
                if (owner.toLowerCase() === account.toLowerCase()) {
                    const name = await poolContract.name();
                    const endTime = await poolContract.endTime();
                    const rewardTokenName = await poolContract.rewardTokenName();
                    const isEnded = Number(endTime) <= now;
                    myPoolsDiv.innerHTML += `
                        <div>
                            <strong>${name}</strong> (${poolAddr})${isEnded ? ' (Ended)' : ''}<br>
                            Reward Token: ${rewardTokenName}
                        </div>`;
                }
            } catch (e) {
                console.warn(`Error processing my pool ${poolAddr}: ${e.message}`);
            }
        }
        if (myPoolsDiv.innerHTML === "") {
            myPoolsDiv.innerHTML = "<p>No pools owned</p>";
        }
    } catch (error) {
        console.error('Load my pools error:', error);
        myPoolsDiv.innerHTML = `<p class="error">Error loading my pools: ${error.message}</p>`;
    }
}

async function loadNFTs() {
    const poolAddr = document.getElementById("selectedPool")?.value;
    const elements = {
        pendingRewards: document.getElementById("pendingRewards"),
        nfts: document.getElementById("nfts"),
        stakedNFTs: document.getElementById("stakedNFTs"),
        bonusNfts: document.getElementById("bonusNfts"),
        stakedBonusNFTs: document.getElementById("stakedBonusNFTs"),
        currentMultiplier: document.getElementById("currentMultiplier"),
        stakeNFTs: document.getElementById("stakeNFTs"),
        stakeBonusNFTs: document.getElementById("stakeBonusNFTs"),
        claimRewards: document.getElementById("claimRewards"),
        nftStatus: document.getElementById("nftStatus")
    };
    if (Object.values(elements).some(el => !el)) {
        console.warn("One or more NFT display elements not found");
        return;
    }
    Object.values(elements).forEach(el => { if (el.tagName !== "BUTTON" && el.id !== "currentMultiplier") el.innerHTML = ""; });
    if (!poolAddr) {
        elements.nfts.innerHTML = "<p>Please select a pool</p>";
        elements.stakeNFTs.disabled = true;
        elements.stakeBonusNFTs.disabled = true;
        elements.claimRewards.disabled = true;
        return;
    }

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "block";
    try {
        const poolContract = new ethers.Contract(poolAddr, poolABI, provider);
        const endTime = await poolContract.endTime();
        const now = Math.floor(Date.now() / 1000);
        if (Number(endTime) <= now) {
            elements.nfts.innerHTML = `<p class="error">Selected pool has ended</p>`;
            elements.stakeNFTs.disabled = true;
            elements.stakeBonusNFTs.disabled = true;
            elements.claimRewards.disabled = true;
            return;
        }
        const pending = await poolContract.earned(account);
        elements.pendingRewards.innerHTML = `Pending Rewards: ${ethers.formatUnits(pending, 18)}`;
        const nftAddr = await poolContract.nft();
        const nftContract = new ethers.Contract(nftAddr, erc721ABI, provider);

        let isERC721 = false;
        try {
            isERC721 = await nftContract.supportsInterface("0x80ac58cd");
        } catch (e) {
            console.warn(`Error checking ERC-721 interface for NFT ${nftAddr}: ${e.message}`);
            elements.nfts.innerHTML = `<p class="error">NFT contract at ${nftAddr} does not support ERC-721: ${e.message}</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }
        if (!isERC721) {
            elements.nfts.innerHTML = `<p class="error">NFT contract at ${nftAddr} does not support ERC-721</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }

        let balance = 0n;
        try {
            balance = await nftContract.balanceOf(account);
        } catch (e) {
            console.warn(`Error fetching balanceOf for ${account} at ${nftAddr}: ${e.message}`);
            elements.nfts.innerHTML = `<p class="error">Error checking NFT balance: ${e.message}</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }

        const nfts = [];
        if (balance == 0n) {
            elements.nfts.innerHTML = `<p>No NFTs owned for contract ${nftAddr}</p>`;
            elements.stakeNFTs.disabled = true;
        } else {
            let enumerableSupported = true;
            try {
                const testTokenId = await nftContract.tokenOfOwnerByIndex(account, 0);
                if (!testTokenId) throw new Error("No token ID returned");
            } catch (e) {
                console.warn(`tokenOfOwnerByIndex not supported or failed for ${nftAddr}: ${e.message}`);
                enumerableSupported = false;
            }

            if (enumerableSupported) {
                try {
                    for (let i = 0n; i < balance; i++) {
                        const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
                        let tokenURI = "";
                        try {
                            tokenURI = await nftContract.tokenURI(tokenId);
                            if (!tokenURI || (!tokenURI.startsWith("http") && !tokenURI.startsWith("ipfs://"))) {
                                console.warn(`Invalid tokenURI for token ${tokenId} at ${nftAddr}`);
                            }
                        } catch (e) {
                            console.warn(`Failed to load tokenURI for token ${tokenId}: ${e.message}`);
                        }
                        nfts.push({ id: tokenId, uri: tokenURI });
                    }
                } catch (e) {
                    console.warn(`Error fetching tokens via tokenOfOwnerByIndex: ${e.message}`);
                    elements.nftStatus.innerHTML += `<p class="warning">Failed to enumerate NFTs: ${e.message}. Attempting fallback method.</p>`;
                    enumerableSupported = false;
                }
            }

            if (!enumerableSupported) {
                let maxTokenId = 10000n;
                try {
                    maxTokenId = await nftContract.totalSupply();
                    console.log(`Total supply for ${nftAddr}: ${maxTokenId}`);
                } catch (e) {
                    console.warn(`totalSupply not supported or failed for ${nftAddr}: ${e.message}. Falling back to maxTokenId=10000.`);
                    elements.nftStatus.innerHTML += `<p class="warning">Warning: totalSupply not supported. Scanning up to token ID 9999.</p>`;
                }

                const batchSize = 50;
                const tokenIds = Array.from({ length: Number(maxTokenId) }, (_, i) => BigInt(i));
                let foundCount = 0n;
                for (let i = 0; i < tokenIds.length; i += batchSize) {
                    const batch = tokenIds.slice(i, i + batchSize);
                    const ownerPromises = batch.map(async (tokenId) => {
                        try {
                            const owner = await nftContract.ownerOf(tokenId);
                            return { tokenId, owner };
                        } catch (e) {
                            return { tokenId, owner: null };
                        }
                    });
                    const results = await Promise.allSettled(ownerPromises);
                    for (const result of results) {
                        if (result.status === "fulfilled" && result.value.owner?.toLowerCase() === account.toLowerCase()) {
                            const tokenId = result.value.tokenId;
                            let tokenURI = "";
                            try {
                                tokenURI = await nftContract.tokenURI(tokenId);
                                if (!tokenURI || (!tokenURI.startsWith("http") && !tokenURI.startsWith("ipfs://"))) {
                                    console.warn(`Invalid tokenURI for token ${tokenId} at ${nftAddr}`);
                                }
                            } catch (e) {
                                console.warn(`Failed to load tokenURI for token ${tokenId}: ${e.message}`);
                            }
                            nfts.push({ id: tokenId, uri: tokenURI });
                            foundCount++;
                        }
                    }
                    if (foundCount >= balance) {
                        console.log(`Found ${foundCount} NFTs, matching balanceOf (${balance}). Stopping enumeration.`);
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (nfts.length === 0) {
                    elements.nfts.innerHTML = `<p class="error">No NFTs found for ${account} in contract ${nftAddr} (scanned up to token ID ${maxTokenId - 1n})</p>`;
                    elements.stakeNFTs.disabled = true;
                    return;
                }
                if (BigInt(nfts.length) !== balance) {
                    console.warn(`Mismatch: balanceOf returned ${balance}, but found ${nfts.length} NFTs via ownerOf`);
                    elements.nftStatus.innerHTML += `<p class="warning">Warning: Found ${nfts.length} NFTs, but balanceOf reported ${balance}. Some tokens may have high IDs or the contract is non-standard.</p>`;
                }
            }

            for (const nft of nfts) {
                let imageURL = 'https://placehold.co/100x100';
                if (nft.uri) {
                    try {
                        const metadataRes = await fetch(
                            nft.uri.startsWith("ipfs://")
                                ? `https://ipfs.io/ipfs/${nft.uri.slice(7)}`
                                : nft.uri
                        );
                        const metadata = await metadataRes.json();
                        imageURL = metadata.image.startsWith("ipfs://")
                            ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
                            : metadata.image;
                    } catch (e) {
                        console.warn(`Failed to fetch metadata for token ${nft.id}: ${e.message}`);
                    }
                }
                elements.nfts.innerHTML += `
                    <div class="nft-item">
                        <input type="checkbox" class="nft-checkbox" data-id="${nft.id}">
                        <img src="${imageURL}" alt="NFT ${nft.id}">
                        <p>Token ID: ${nft.id}</p>
                    </div>`;
            }
        }

        const stakedTokens = await poolContract.getUserStakedTokens(account);
        for (const tokenId of stakedTokens) {
            let tokenURI = "";
            try {
                tokenURI = await nftContract.tokenURI(tokenId);
                if (!tokenURI || (!tokenURI.startsWith("http") && !tokenURI.startsWith("ipfs://"))) {
                    console.warn(`Invalid tokenURI for staked token ${tokenId} at ${nftAddr}`);
                }
            } catch (e) {
                console.warn(`Failed to load tokenURI for staked token ${tokenId}: ${e.message}`);
            }
            let imageURL = 'https://placehold.co/100x100';
            if (tokenURI) {
                try {
                    const metadataRes = await fetch(
                        tokenURI.startsWith("ipfs://")
                            ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
                            : tokenURI
                    );
                    const metadata = await metadataRes.json();
                    imageURL = metadata.image.startsWith("ipfs://")
                        ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
                        : metadata.image;
                } catch (e) {
                    console.warn(`Failed to fetch metadata for staked token ${tokenId}: ${e.message}`);
                }
            }
            elements.stakedNFTs.innerHTML += `
                <div class="nft-item">
                    <input type="checkbox" class="staked-nft-checkbox" data-id="${tokenId}">
                    <img src="${imageURL}" alt="Staked NFT ${tokenId}">
                    <p>Token ID: ${tokenId}</p>
                </div>`;
        }
        elements.stakeNFTs.disabled = nfts.length === 0;
        const unstakeNFTs = document.getElementById("unstakeNFTs");
        if (unstakeNFTs) unstakeNFTs.disabled = stakedTokens.length === 0;
        elements.claimRewards.disabled = stakedTokens.length === 0;

        const bonusAddr = await poolContract.bonusNFT();
        if (bonusAddr !== ethers.ZeroAddress) {
            const bonusElements = ["bonusNfts", "approveBonusNFTs", "selectAllBonusStake", "stakeBonusNFTs", "stakedBonusNFTs", "selectAllBonusUnstake", "unstakeBonusNFTs"];
            bonusElements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = "block";
            });
            const bonusContract = new ethers.Contract(bonusAddr, erc721ABI, provider);
            let bonusBalance = 0n;
            try {
                bonusBalance = await bonusContract.balanceOf(account);
            } catch (e) {
                console.warn(`Error fetching bonus NFT balance for ${account} at ${bonusAddr}: ${e.message}`);
                elements.bonusNfts.innerHTML = `<p class="error">Error checking bonus NFT balance: ${e.message}</p>`;
                elements.stakeBonusNFTs.disabled = true;
                return;
            }
            const bonusNfts = [];
            if (bonusBalance == 0n) {
                elements.bonusNfts.innerHTML = `<p>No bonus NFTs owned for contract ${bonusAddr}</p>`;
                elements.stakeBonusNFTs.disabled = true;
            } else {
                let bonusMaxTokenId = 10000n;
                try {
                    bonusMaxTokenId = await bonusContract.totalSupply();
                    console.log(`Total supply for bonus NFT ${bonusAddr}: ${bonusMaxTokenId}`);
                } catch (e) {
                    console.warn(`totalSupply not supported or failed for bonus NFT ${bonusAddr}: ${e.message}. Falling back to maxTokenId=10000.`);
                    elements.nftStatus.innerHTML += `<p class="warning">Warning: Bonus NFT totalSupply not supported. Scanning up to token ID 9999.</p>`;
                }

                const batchSize = 50;
                const bonusTokenIds = Array.from({ length: Number(bonusMaxTokenId) }, (_, i) => BigInt(i));
                for (let i = 0; i < bonusTokenIds.length; i += batchSize) {
                    const batch = bonusTokenIds.slice(i, i + batchSize);
                    const ownerPromises = batch.map(async (tokenId) => {
                        try {
                            const owner = await bonusContract.ownerOf(tokenId);
                            return { tokenId, owner };
                        } catch (e) {
                            return { tokenId, owner: null };
                        }
                    });
                    const results = await Promise.allSettled(ownerPromises);
                    for (const result of results) {
                        if (result.status === "fulfilled" && result.value.owner?.toLowerCase() === account.toLowerCase()) {
                            const tokenId = result.value.tokenId;
                            let tokenURI = "";
                            try {
                                tokenURI = await bonusContract.tokenURI(tokenId);
                            } catch (e) {
                                console.warn(`Failed to load tokenURI for bonus token ${tokenId}: ${e.message}`);
                            }
                            bonusNfts.push({ id: tokenId, uri: tokenURI });
                        }
                    }
                    if (BigInt(bonusNfts.length) >= bonusBalance) {
                        console.log(`Found ${bonusNfts.length} bonus NFTs, matching balanceOf (${bonusBalance}). Stopping enumeration.`);
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (bonusNfts.length === 0) {
                    elements.bonusNfts.innerHTML = `<p class="error">No bonus NFTs owned for contract ${bonusAddr} (scanned up to token ID ${bonusMaxTokenId - 1n})</p>`;
                    elements.stakeBonusNFTs.disabled = true;
                } else if (BigInt(bonusNfts.length) !== bonusBalance) {
                    console.warn(`Mismatch: bonus balanceOf returned ${bonusBalance}, but found ${bonusNfts.length} NFTs via ownerOf`);
                    elements.nftStatus.innerHTML += `<p class="warning">Warning: Found ${bonusNfts.length} bonus NFTs, but balanceOf reported ${bonusBalance}</p>`;
                }

                for (const nft of bonusNfts) {
                    let imageURL = 'https://placehold.co/100x100';
                    if (nft.uri) {
                        try {
                            const metadataRes = await fetch(
                                nft.uri.startsWith("ipfs://")
                                    ? `https://ipfs.io/ipfs/${nft.uri.slice(7)}`
                                    : nft.uri
                            );
                            const metadata = await metadataRes.json();
                            imageURL = metadata.image.startsWith("ipfs://")
                                ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
                                : metadata.image;
                        } catch (e) {
                            console.warn(`Failed to fetch metadata for bonus token ${nft.id}: ${e.message}`);
                        }
                    }
                    elements.bonusNfts.innerHTML += `
                        <div class="nft-item">
                            <input type="checkbox" class="bonus-nft-checkbox" data-id="${nft.id}">
                            <img src="${imageURL}" alt="Bonus NFT ${nft.id}">
                            <p>Token ID: ${nft.id}</p>
                        </div>`;
                }
            }

            const stakedBonusTokens = await poolContract.getUserBonusStakedTokens(account);
            for (const tokenId of stakedBonusTokens) {
                let tokenURI = "";
                try {
                    tokenURI = await bonusContract.tokenURI(tokenId);
                } catch (e) {
                    console.warn(`Failed to load tokenURI for staked bonus token ${tokenId}: ${e.message}`);
                }
                let imageURL = 'https://placehold.co/100x100';
                if (tokenURI) {
                    try {
                        const metadataRes = await fetch(
                            tokenURI.startsWith("ipfs://")
                                ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
                                : tokenURI
                        );
                        const metadata = await metadataRes.json();
                        imageURL = metadata.image.startsWith("ipfs://")
                            ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
                            : metadata.image;
                    } catch (e) {
                        console.warn(`Failed to fetch metadata for staked bonus token ${tokenId}: ${e.message}`);
                    }
                }
                elements.stakedBonusNFTs.innerHTML += `
                    <div class="nft-item">
                        <input type="checkbox" class="staked-bonus-nft-checkbox" data-id="${tokenId}">
                        <img src="${imageURL}" alt="Staked Bonus NFT ${tokenId}">
                        <p>Token ID: ${tokenId}</p>
                    </div>`;
                }
            elements.stakeBonusNFTs.disabled = bonusNfts.length === 0 || stakedBonusTokens.length >= 3;
            const unstakeBonusNFTs = document.getElementById("unstakeBonusNFTs");
            if (unstakeBonusNFTs) unstakeBonusNFTs.disabled = stakedBonusTokens.length === 0;
            const multiplier = await poolContract.getUserMultiplier(account);
            const multiplierValue = Number(ethers.formatUnits(multiplier, 18));
            const bonusPercent = ((multiplierValue - 1) * 100).toFixed(2);
            elements.currentMultiplier.innerHTML = `Current Bonus: ${bonusPercent}%`;
        } else {
            const bonusElements = ["bonusNfts", "approveBonusNFTs", "selectAllBonusStake", "stakeBonusNFTs", "stakedBonusNFTs", "selectAllBonusUnstake", "unstakeBonusNFTs"];
            bonusElements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = "none";
            });
            elements.currentMultiplier.innerHTML = "";
        }
    } catch (error) {
        console.error('Load NFTs error:', error);
        elements.nfts.innerHTML = `<p class="error">Error loading NFTs: ${error.message}</p>`;
        elements.stakeNFTs.disabled = true;
    } finally {
        if (loading) loading.style.display = "none";
    }
}

async function deployPool() {
    const deployStatus = document.getElementById("deployStatus");
    if (!deployStatus) return;
    try {
        const inputs = {
            nftAddress: document.getElementById("nftAddress"),
            rewardToken: document.getElementById("rewardToken"),
            startTime: document.getElementById("startTime"),
            endTime: document.getElementById("endTime"),
            totalRewards: document.getElementById("totalRewards"),
            poolName: document.getElementById("poolName"),
            poolImage: document.getElementById("poolImage")
        };
        if (Object.values(inputs).some(input => !input)) throw new Error("One or more input fields not found");

        const nftAddr = inputs.nftAddress.value;
        const rewardToken = inputs.rewardToken.value;
        const startTime = Math.floor(new Date(inputs.startTime.value).getTime() / 1000);
        const endTime = Math.floor(new Date(inputs.endTime.value).getTime() / 1000);
        const totalRewards = ethers.parseUnits(inputs.totalRewards.value, 18);
        const poolName = inputs.poolName.value;
        const poolImage = inputs.poolImage.files[0];

        if (!isValidAddress(nftAddr) || !isValidAddress(rewardToken)) {
            throw new Error("Invalid NFT or reward token address");
        }
        if (startTime <= Math.floor(Date.now() / 1000) || endTime <= startTime) {
            throw new Error("Invalid start or end time");
        }
        if (totalRewards <= 0) {
            throw new Error("Total rewards must be greater than 0");
        }
        if (!poolName) {
            throw new Error("Pool name is required");
        }

        const rewardContract = new ethers.Contract(rewardToken, erc20ABI, signer);
        const rewardAllowance = await rewardContract.allowance(account, factoryContract.target);
        if (rewardAllowance < totalRewards) {
            const approveRewardGas = await rewardContract.approve.estimateGas(factoryContract.target, totalRewards);
            await (await rewardContract.approve(factoryContract.target, totalRewards, { gasLimit: approveRewardGas * 12n / 10n })).wait();
            displaySuccess("deployStatus", "Reward token approved!");
        }

        const usdcDecimals = await getUsdcDecimals();
        const openFee = await factoryContract.openFee();
        if (openFee > 0) {
            const usdcContract = new ethers.Contract(networkConfig[selectedNetwork].usdcAddress, erc20ABI, signer);
            const usdcAllowance = await usdcContract.allowance(account, factoryContract.target);
            if (usdcAllowance < openFee) {
                const approveUsdcGas = await usdcContract.approve.estimateGas(factoryContract.target, openFee);
                await (await usdcContract.approve(factoryContract.target, openFee, { gasLimit: approveUsdcGas * 12n / 10n })).wait();
                displaySuccess("deployStatus", "USDC approved for open fee!");
            }
        }

        const gasEstimate = await factoryContract.createPool.estimateGas(nftAddr, rewardToken, startTime, endTime, totalRewards, poolName);
        const tx = await factoryContract.createPool(nftAddr, rewardToken, startTime, endTime, totalRewards, poolName, { gasLimit: gasEstimate * 12n / 10n });
        const receipt = await tx.wait();
        const poolCreatedEvent = receipt.logs
            .map(log => {
                try {
                    return factoryContract.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .find(event => event && event.name === 'PoolCreated');

        if (!poolCreatedEvent) {
            throw new Error("PoolCreated event not found in transaction receipt");
        }

        const poolAddr = poolCreatedEvent.args.pool;

        if (poolImage) {
            const reader = new FileReader();
            reader.onload = () => {
                imageStorage[poolAddr] = reader.result;
                loadPools();
            };
            reader.readAsDataURL(poolImage);
        } else {
            imageStorage[poolAddr] = await getDefaultNFTImage(nftAddr);
        }

        displaySuccess("deployStatus", `Pool deployed successfully at ${poolAddr}!`);
        const manageSections = ["manageSection", "endedPoolsSection"];
        manageSections.forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = "block";
        });
        await loadPools();
        await loadMyPools();
    } catch (error) {
        console.error('Deploy pool error:', error);
        displayError("deployStatus", `Failed to deploy pool: ${error.message}`);
    }
}

async function setPoolImage() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const poolImage = document.getElementById("newPoolImage")?.files[0];
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, provider);
        const nftAddr = await poolContract.nft();
        if (poolImage) {
            const reader = new FileReader();
            reader.onload = () => {
                imageStorage[poolAddr] = reader.result;
                displaySuccess("manageStatus", "Pool image set successfully!");
                loadPools();
            };
            reader.readAsDataURL(poolImage);
        } else {
            imageStorage[poolAddr] = await getDefaultNFTImage(nftAddr);
            displaySuccess("manageStatus", "Pool image set to default NFT image!");
            loadPools();
        }
    } catch (error) {
        console.error('Set pool image error:', error);
        displayError("manageStatus", `Error setting pool image: ${error.message}`);
    }
}

async function approveNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);
        const nftAddr = await poolContract.nft();
        const nftContract = new ethers.Contract(nftAddr, erc721ABI, signer);
        const isApproved = await nftContract.isApprovedForAll(account, poolAddr);
        if (!isApproved) {
            const gasEstimate = await nftContract.setApprovalForAll.estimateGas(poolAddr, true);
            const tx = await nftContract.setApprovalForAll(poolAddr, true, { gasLimit: gasEstimate * 12n / 10n });
            await tx.wait();
            displaySuccess("stakeStatus", "NFTs approved for staking!");
        } else {
            displaySuccess("stakeStatus", "NFTs already approved!");
        }
        const stakeNFTs = document.getElementById("stakeNFTs");
        if (stakeNFTs) stakeNFTs.disabled = false;
    } catch (error) {
        console.error('Approve NFTs error:', error);
        displayError("stakeStatus", `Error approving NFTs: ${error.message}`);
    }
}

async function approveBonusNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);
        const bonusAddr = await poolContract.bonusNFT();
        if (bonusAddr === ethers.ZeroAddress) throw new Error("No bonus NFT set for this pool");
        const bonusContract = new ethers.Contract(bonusAddr, erc721ABI, signer);
        const isApproved = await bonusContract.isApprovedForAll(account, poolAddr);
        if (!isApproved) {
            const gasEstimate = await bonusContract.setApprovalForAll.estimateGas(poolAddr, true);
            const tx = await bonusContract.setApprovalForAll(poolAddr, true, { gasLimit: gasEstimate * 12n / 10n });
            await tx.wait();
            displaySuccess("stakeStatus", "Bonus NFTs approved for staking!");
        } else {
            displaySuccess("stakeStatus", "Bonus NFTs already approved!");
        }
        const stakeBonusNFTs = document.getElementById("stakeBonusNFTs");
        if (stakeBonusNFTs) stakeBonusNFTs.disabled = false;
    } catch (error) {
        console.error('Approve bonus NFTs error:', error);
        displayError("stakeStatus", `Error approving bonus NFTs: ${error.message}`);
    }
}

async function stakeNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        console.log(`Staking NFTs for pool: ${poolAddr}, account: ${account}`);

        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);
        const nftAddr = await poolContract.nft();
        const nftContract = new ethers.Contract(nftAddr, erc721ABI, signer);

        const startTime = await poolContract.startTime();
        const endTime = await poolContract.endTime();
        const now = Math.floor(Date.now() / 1000);
        if (Number(startTime) > now) throw new Error(`Pool not started: starts at ${new Date(Number(startTime) * 1000).toLocaleString()}`);
        if (Number(endTime) <= now) throw new Error(`Pool has ended: ended at ${new Date(Number(endTime) * 1000).toLocaleString()}`);

        const isERC721 = await nftContract.supportsInterface("0x80ac58cd");
        if (!isERC721) throw new Error(`NFT contract at ${nftAddr} is not ERC-721 compliant`);

        const checkboxes = document.getElementsByClassName("nft-checkbox");
        const tokenIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ethers.toBigInt(cb.dataset.id));
        if (tokenIds.length === 0) throw new Error("No NFTs selected");
        console.log(`Selected token IDs: ${tokenIds}`);

        const stakedTokens = await poolContract.getUserStakedTokens(account);
        console.log(`Already staked tokens: ${stakedTokens}`);
        const validTokenIds = tokenIds.filter(tokenId => !stakedTokens.includes(tokenId));
        if (validTokenIds.length === 0) throw new Error("All selected NFTs are already staked");
        if (validTokenIds.length < tokenIds.length) {
            console.warn(`Filtered out ${tokenIds.length - validTokenIds.length} already staked tokens`);
            displayError("stakeStatus", `Some selected NFTs are already staked. Proceeding with ${validTokenIds.length} valid tokens.`);
        }

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.stake.estimateGas(validTokenIds, { value: txFee });
        const tx = await poolContract.stake(validTokenIds, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("stakeStatus", `Successfully staked ${validTokenIds.length} NFTs!`);
        await loadNFTs();
    } catch (error) {
        console.error('Stake NFTs error:', error);
        displayError("stakeStatus", `Error staking NFTs: ${error.message}`);
    }
}

async function unstakeNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const checkboxes = document.getElementsByClassName("staked-nft-checkbox");
        const tokenIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ethers.toBigInt(cb.dataset.id));
        if (tokenIds.length === 0) throw new Error("No NFTs selected");

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.unstake.estimateGas(tokenIds, { value: txFee });
        const tx = await poolContract.unstake(tokenIds, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("stakeStatus", `Successfully unstaked ${tokenIds.length} NFTs!`);
        await loadNFTs();
    } catch (error) {
        console.error('Unstake NFTs error:', error);
        displayError("stakeStatus", `Error unstaking NFTs: ${error.message}`);
    }
}

async function claimRewards() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const checkboxes = document.getElementsByClassName("staked-nft-checkbox");
        const tokenIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ethers.toBigInt(cb.dataset.id));
        if (tokenIds.length === 0) throw new Error("No NFTs selected");

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.claim.estimateGas(tokenIds, { value: txFee });
        const tx = await poolContract.claim(tokenIds, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("stakeStatus", "Rewards claimed successfully!");
        await loadNFTs();
    } catch (error) {
        console.error('Claim rewards error:', error);
        displayError("stakeStatus", `Error claiming rewards: ${error.message}`);
    }
}

async function stakeBonusNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);
        const bonusAddr = await poolContract.bonusNFT();
        if (bonusAddr === ethers.ZeroAddress) throw new Error("No bonus NFT set for this pool");
        const bonusContract = new ethers.Contract(bonusAddr, erc721ABI, signer);

        // Verify pool status
        const startTime = await poolContract.startTime();
        const endTime = await poolContract.endTime();
        const now = Math.floor(Date.now() / 1000);
        if (Number(startTime) > now) throw new Error(`Pool not started: starts at ${new Date(Number(startTime) * 1000).toLocaleString()}`);
        if (Number(endTime) <= now) throw new Error(`Pool has ended: ended at ${new Date(Number(endTime) * 1000).toLocaleString()}`);

        const checkboxes = document.getElementsByClassName("bonus-nft-checkbox");
        const tokenIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ethers.toBigInt(cb.dataset.id));
        if (tokenIds.length === 0) throw new Error("No bonus NFTs selected");

        const stakedBonusTokens = await poolContract.getUserBonusStakedTokens(account);
        if (stakedBonusTokens.length + tokenIds.length > 3) throw new Error(`Cannot stake more than 3 bonus NFTs (currently ${stakedBonusTokens.length} staked)`);

        let isApproved = await bonusContract.isApprovedForAll(account, poolAddr);
        if (!isApproved) {
            const gasEstimate = await bonusContract.setApprovalForAll.estimateGas(poolAddr, true);
            const tx = await bonusContract.setApprovalForAll(poolAddr, true, { gasLimit: gasEstimate * 12n / 10n });
            await tx.wait();
            displaySuccess("stakeStatus", "Bonus NFTs approved!");
        }

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.stakeBonus.estimateGas(tokenIds, { value: txFee });
        const tx = await poolContract.stakeBonus(tokenIds, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("stakeStatus", `Successfully staked ${tokenIds.length} bonus NFTs!`);
        await loadNFTs();
    } catch (error) {
        console.error('Stake bonus NFTs error:', error);
        displayError("stakeStatus", `Error staking bonus NFTs: ${error.message}`);
    }
}

async function unstakeBonusNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const checkboxes = document.getElementsByClassName("staked-bonus-nft-checkbox");
        const tokenIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ethers.toBigInt(cb.dataset.id));
        if (tokenIds.length === 0) throw new Error("No bonus NFTs selected");

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.unstakeBonus.estimateGas(tokenIds, { value: txFee });
        const tx = await poolContract.unstakeBonus(tokenIds, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("stakeStatus", `Successfully unstaked ${tokenIds.length} bonus NFTs!`);
        await loadNFTs();
    } catch (error) {
        console.error('Unstake bonus NFTs error:', error);
        displayError("stakeStatus", `Error unstaking bonus NFTs: ${error.message}`);
    }
}

async function addRewards() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const amountInput = document.getElementById("addRewardAmount");
        if (!poolAddr || !amountInput) throw new Error("Pool or amount input not found");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);
        const rewardTokenAddr = await poolContract.rewardToken();
        const rewardContract = new ethers.Contract(rewardTokenAddr, erc20ABI, signer);
        const amount = ethers.parseUnits(amountInput.value, 18);

        const allowance = await rewardContract.allowance(account, poolAddr);
        if (allowance < amount) {
            const approveGas = await rewardContract.approve.estimateGas(poolAddr, amount);
            const tx = await rewardContract.approve(poolAddr, amount, { gasLimit: approveGas * 12n / 10n });
            await tx.wait();
            displaySuccess("manageStatus", "Reward token approved!");
        }

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} ${selectedNetwork === 'cronos' ? 'CRO' : 'MATIC'} required`);

        const gasEstimate = await poolContract.addRewards.estimateGas(amount, { value: txFee });
        const tx = await poolContract.addRewards(amount, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Rewards added successfully!");
        await loadPools();
    } catch (error) {
        console.error('Add rewards error:', error);
        displayError("manageStatus", `Error adding rewards: ${error.message}`);
    }
}

async function withdrawExcessRewards() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const amountInput = document.getElementById("withdrawExcessAmount");
        if (!poolAddr || !amountInput) throw new Error("Pool or amount input not found");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);
        const amount = ethers.parseUnits(amountInput.value, 18);

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} ${selectedNetwork === 'cronos' ? 'CRO' : 'MATIC'} required`);

        const gasEstimate = await poolContract.withdrawExcessRewards.estimateGas(amount);
        const tx = await poolContract.withdrawExcessRewards(amount, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Excess rewards withdrawn successfully!");
        await loadPools();
    } catch (error) {
        console.error('Withdraw excess rewards error:', error);
        displayError("manageStatus", `Error withdrawing excess rewards: ${error.message}`);
    }
}

async function setEndTime() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const newEndTime = document.getElementById("newEndTime")?.value;
        if (!poolAddr || !newEndTime) throw new Error("No pool or end time selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);
        const newEnd = Math.floor(new Date(newEndTime).getTime() / 1000);
        if (newEnd <= Math.floor(Date.now() / 1000)) throw new Error("New end time must be in the future");

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.setEndTime.estimateGas(newEnd, { value: txFee });
        const tx = await poolContract.setEndTime(newEnd, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "End time updated successfully!");
        await loadPools();
    } catch (error) {
        console.error('Set end time error:', error);
        displayError("manageStatus", `Error setting end time: ${error.message}`);
    }
}

async function setRewardTokenName() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const newName = document.getElementById("newRewardTokenName")?.value;
        if (!poolAddr || !newName) throw new Error("No pool or reward token name provided");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.setRewardTokenName.estimateGas(newName, { value: txFee }); 
        const tx = await poolContract.setRewardTokenName(newName, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Reward token name updated successfully!");
        await loadPools();
    } catch (error) {
        console.error('Set reward token name error:', error);
        displayError("manageStatus", `Error setting reward token name: ${error.message}`);
    }
}

async function setBonusNFT() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const bonusAddr = document.getElementById("bonusNFTAddress")?.value;
        if (!poolAddr || !bonusAddr) throw new Error("No pool or bonus NFT address provided");
        if (!isValidAddress(bonusAddr)) throw new Error("Invalid bonus NFT address");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        const gasEstimate = await poolContract.setBonusNFT.estimateGas(bonusAddr, { value: txFee });
        const tx = await poolContract.setBonusNFT(bonusAddr, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Bonus NFT set successfully!");
        await loadNFTs();
    } catch (error) {
        console.error('Set bonus NFT error:', error);
        displayError("manageStatus", `Error setting bonus NFT: ${error.message}`);
    }
}

async function endPool() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const gasEstimate = await poolContract.endPoolNow.estimateGas();
        const tx = await poolContract.endPoolNow({ gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Pool ended successfully!");
        await loadPools();
    } catch (error) {
        console.error('End pool error:', error);
        displayError("manageStatus", `Error ending pool: ${error.message}`);
    }
}

async function withdrawRemaining() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const gasEstimate = await poolContract.withdrawRemaining.estimateGas();
        const tx = await poolContract.withdrawRemaining({ gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Remaining rewards withdrawn successfully!");
        await loadPools();
    } catch (error) {
        console.error('Withdraw remaining error:', error);
        displayError("manageStatus", `Error withdrawing remaining rewards: ${error.message}`);
    }
}

// New function to change the pool's NFT address
async function setNFT() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const newNFTAddr = document.getElementById("newNFTAddress")?.value;
        if (!poolAddr || !newNFTAddr) throw new Error("No pool or new NFT address provided");
        if (!isValidAddress(newNFTAddr)) throw new Error("Invalid new NFT address");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} ${selectedNetwork === 'cronos' ? 'CRO' : 'MATIC'} required`);

        const gasEstimate = await poolContract.setNFT.estimateGas(newNFTAddr);
        const tx = await poolContract.setNFT(newNFTAddr, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Pool NFT address updated successfully!");
        await loadPools();
        await loadNFTs(); // Reload NFTs to reflect new NFT contract
    } catch (error) {
        console.error('Set NFT error:', error);
        displayError("manageStatus", `Error setting pool NFT address: ${error.message}`);
    }
}

// New function to change the pool's reward token address
async function setRewardToken() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const newRewardTokenAddr = document.getElementById("newRewardTokenAddress")?.value;
        if (!poolAddr || !newRewardTokenAddr) throw new Error("No pool or new reward token address provided");
        if (!isValidAddress(newRewardTokenAddr)) throw new Error("Invalid new reward token address");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} ${selectedNetwork === 'cronos' ? 'CRO' : 'MATIC'} required`);

        const gasEstimate = await poolContract.setRewardToken.estimateGas(newRewardTokenAddr);
        const tx = await poolContract.setRewardToken(newRewardTokenAddr, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Pool reward token address updated successfully!");
        await loadPools();
    } catch (error) {
        console.error('Set reward token error:', error);
        displayError("manageStatus", `Error setting pool reward token address: ${error.message}`);
    }
}

function toggleSection(sectionId, toggleId) {
    const section = document.getElementById(sectionId);
    const toggleButton = document.getElementById(toggleId);
    if (!section || !toggleButton) return;
    section.style.display = section.style.display === "none" ? "block" : "none";
    toggleButton.innerText = section.style.display === "none" ? `Expand ${sectionId.replace('Content', '')}` : `Collapse ${sectionId.replace('Content', '')}`;
}

function selectAllNFTs(checkboxClass, checked) {
    const checkboxes = document.getElementsByClassName(checkboxClass);
    for (const checkbox of checkboxes) {
        checkbox.checked = checked;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    createStars();
    const networkSelect = document.getElementById("networkSelect");
    if (networkSelect) {
    selectedNetwork = networkSelect.value; // Set initial network
    networkSelect.addEventListener("change", async (e) => {
        selectedNetwork = e.target.value;
        await switchNetwork(selectedNetwork);
        await connectWallet();
    });
}

    function toggleSelectAll(buttonId, checkboxClass) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        let selected = false;
        button.addEventListener("click", () => {
            selected = !selected;
            selectAllNFTs(checkboxClass, selected);
            button.innerText = selected ? "Unselect All" : "Select All";
        });
    }

    const connectButton = document.getElementById("connectWallet");
    if (connectButton) connectButton.addEventListener("click", connectWallet);

    const copyButton = document.getElementById("copyWallet");
    if (copyButton) copyButton.addEventListener("click", copyWallet);

    const deployButton = document.getElementById("deployPool");
    if (deployButton) deployButton.addEventListener("click", deployPool);

    const approveButton = document.getElementById("approveNFTs");
    if (approveButton) approveButton.addEventListener("click", approveNFTs);

    const approveBonusButton = document.getElementById("approveBonusNFTs");
    if (approveBonusButton) approveBonusButton.addEventListener("click", approveBonusNFTs);

    const stakeButton = document.getElementById("stakeNFTs");
    if (stakeButton) stakeButton.addEventListener("click", stakeNFTs);

    const stakeBonusButton = document.getElementById("stakeBonusNFTs");
    if (stakeBonusButton) stakeBonusButton.addEventListener("click", stakeBonusNFTs);

    const unstakeButton = document.getElementById("unstakeNFTs");
    if (unstakeButton) unstakeButton.addEventListener("click", unstakeNFTs);

    const unstakeBonusButton = document.getElementById("unstakeBonusNFTs");
    if (unstakeBonusButton) unstakeBonusButton.addEventListener("click", unstakeBonusNFTs);

    const claimButton = document.getElementById("claimRewards");
    if (claimButton) claimButton.addEventListener("click", claimRewards);

    const setEndTimeButton = document.getElementById("setEndTime");
    if (setEndTimeButton) setEndTimeButton.addEventListener("click", setEndTime);

    const setRewardTokenNameButton = document.getElementById("setRewardTokenName");
    if (setRewardTokenNameButton) setRewardTokenNameButton.addEventListener("click", setRewardTokenName);

    const setBonusNFTButton = document.getElementById("setBonusNFT");
    if (setBonusNFTButton) setBonusNFTButton.addEventListener("click", setBonusNFT);

    const setPoolImageButton = document.getElementById("setPoolImage");
    if (setPoolImageButton) setPoolImageButton.addEventListener("click", setPoolImage);

    const addRewardsButton = document.getElementById("addRewards");
    if (addRewardsButton) addRewardsButton.addEventListener("click", addRewards);

    const withdrawExcessButton = document.getElementById("withdrawExcessRewards");
    if (withdrawExcessButton) withdrawExcessButton.addEventListener("click", withdrawExcessRewards);

    const endPoolButton = document.getElementById("endPool");
    if (endPoolButton) endPoolButton.addEventListener("click", endPool);

    const withdrawRemainingButton = document.getElementById("withdrawRemaining");
    if (withdrawRemainingButton) withdrawRemainingButton.addEventListener("click", withdrawRemaining);

    const withdrawNativeButton = document.getElementById("withdrawNative");
    if (withdrawNativeButton) withdrawNativeButton.addEventListener("click", withdrawNativeAdmin);

    const withdrawUsdcButton = document.getElementById("withdrawUsdc");
    if (withdrawUsdcButton) withdrawUsdcButton.addEventListener("click", withdrawUsdcAdmin);

    const setOpenFeeButton = document.getElementById("setOpenFee");
    if (setOpenFeeButton) setOpenFeeButton.addEventListener("click", setOpenFee);

    const setTxFeeButton = document.getElementById("setTxFee");
    if (setTxFeeButton) setTxFeeButton.addEventListener("click", setTxFee);

    const setExemptButton = document.getElementById("setExempt");
    if (setExemptButton) setExemptButton.addEventListener("click", setExempt);

    const selectAllStake = document.getElementById("selectAllStake");
    if (selectAllStake) selectAllStake.addEventListener("click", (e) => selectAllNFTs("nft-checkbox", true));

    const selectAllUnstake = document.getElementById("selectAllUnstake");
    if (selectAllUnstake) selectAllUnstake.addEventListener("click", (e) => selectAllNFTs("staked-nft-checkbox", true));

    const selectAllBonusStake = document.getElementById("selectAllBonusStake");
    if (selectAllBonusStake) selectAllBonusStake.addEventListener("change", (e) => selectAllNFTs("bonus-nft-checkbox", true));

    const selectAllBonusUnstake = document.getElementById("selectAllBonusUnstake");
    if (selectAllBonusUnstake) selectAllBonusUnstake.addEventListener("change", (e) => selectAllNFTs("staked-bonus-nft-checkbox", true));

    const selectedPool = document.getElementById("selectedPool");
    if (selectedPool) selectedPool.addEventListener("change", loadNFTs);

    const managePool = document.getElementById("managePool");
    if (managePool) managePool.addEventListener("change", () => {
        const manageStatus = document.getElementById("manageStatus");
        if (manageStatus) manageStatus.innerText = "";
    });
    
    const howToUseButton = document.getElementById("howToUse");
    if (howToUseButton) {
    howToUseButton.addEventListener("click", () => {
        document.getElementById("howToUseModal").style.display = "flex";
    });
    }

    const toggleButtons = [
        { id: "toggleDeploy", section: "deployContent" },
        { id: "toggleStake", section: "stakeContent" },
        { id: "toggleUnstake", section: "unstakeContent" },
        { id: "toggleManage", section: "manageContent" },
        { id: "toggleAdmin", section: "adminContent" },
        { id: "toggleEndedPools", section: "endedPoolsContent" }
    ];
    toggleButtons.forEach(({ id, section }) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener("click", () => toggleSection(section, id));
    });

    toggleSelectAll("selectAllStake", "nft-checkbox");
    toggleSelectAll("selectAllUnstake", "staked-nft-checkbox");
    toggleSelectAll("selectAllBonusStake", "bonus-nft-checkbox");
    toggleSelectAll("selectAllBonusUnstake", "staked-bonus-nft-checkbox");

    // Handle MetaMask network/account changes
    if (window.ethereum) {
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                account = accounts[0];
                displaySuccess("walletStatus", `Connected: ${account}`);
                const walletAddress = document.getElementById("walletAddress");
                if (walletAddress) walletAddress.innerText = `Wallet Address: ${account}`;
                connectWallet();
            } else {
                displayError("walletStatus", "Wallet disconnected");
                account = null;
                const sections = ["deploySection", "stakeSection", "unstakeSection", "manageSection", "adminSection", "endedPoolsSection"];
                sections.forEach(id => {
                    const section = document.getElementById(id);
                    if (section) section.style.display = "none";
                });
            }
        });
    }
    });
