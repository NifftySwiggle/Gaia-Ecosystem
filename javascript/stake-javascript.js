let selectedNetwork = null;

// Hamburger toggle (add once, merge if you already have DOMContentLoaded logic)
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navDropdown = document.getElementById('navDropdown');

    if (hamburgerBtn && navDropdown) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navDropdown.classList.toggle('show');
            navDropdown.setAttribute('aria-hidden', String(!navDropdown.classList.contains('show')));
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburgerBtn.contains(e.target) && !navDropdown.contains(e.target)) {
                navDropdown.classList.remove('show');
                navDropdown.setAttribute('aria-hidden', 'true');
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                navDropdown.classList.remove('show');
                navDropdown.setAttribute('aria-hidden', 'true');
            }
        });
    }
});

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
        factoryAddress: "0x5F40F8C54a09BEB0a75cCB61b829513D6b151927",
        rpcUrl: "https://evm.cronos.org",
        usdcAddress: "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59"
    },
    polygon: {
        chainId: '0x89',
        factoryAddress: "0x6f147D79bD0886eCcaF79fCBC920d16e65035A3b",
        rpcUrl: "https://polygon-rpc.com",
        usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
    },
    monad: {
        chainId: '0x8f',
        factoryAddress: "0x12fF9437f3D616d9f82168b57Eb4190466FC77dD",
        rpcUrl: "https://rpc.monad.xyz",
        usdcAddress: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603"
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
    "function getUserStakedTokens(address user) external view returns (uint256[])",
    "function getUserBonusStakedTokens(address user) external view returns (uint256[])",
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
    "function txFee() external view returns (uint256)",
    "function getNFTMultiplier(address user) external view returns (uint256)",
    "function stakedBy(uint256 tokenId) external view returns (address)",
    "function setPoolName(string newName) external payable",
    "function setNFT(address newNFT) external payable",
    "function setRewardToken(address newRewardToken) external payable",
    "function nftRewards(uint256 tokenId) external view returns (uint256)",
    // optional internals useful for debugging (many pools expose these as public views)
    "function rewardPerTokenStored() external view returns (uint256)",
    "function rewardPerToken() external view returns (uint256)",
    "function lastUpdateTime() external view returns (uint256)",
    "function nftRewardPerTokenPaid(uint256 tokenId) external view returns (uint256)",
    "function totalNFTsStaked() external view returns (uint256)"
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

const ipfsGateways = [
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://nftstorage.link/ipfs/"
];

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
        let metadata;
        if (tokenURI.startsWith("ipfs://")) {
            metadata = await fetchIpfsJson(tokenURI);
        } else {
            const metadataRes = await fetch(tokenURI);
            metadata = await metadataRes.json();
        }
        return metadata.image.startsWith("ipfs://")
            ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}`
            : metadata.image;
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
                                name: network === 'cronos' ? 'Cronos' : network === 'monad' ? 'Monad' : 'MATIC',
                                symbol: network === 'cronos' ? 'CRO' : network === 'monad' ? 'MON' : 'MATIC',
                                decimals: 18,
                            },
                            blockExplorerUrls: [network === 'cronos' ? 'https://cronosscan.com' : network === 'monad' ? 'https://monadvision.com' : 'https://polygonscan.com'],
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

function displayError(elementId, error) {
    const el = document.getElementById(elementId);
    const { title, detail, level, opts } = formatErrorMessage(error);
    if (el) {
        if (level === 'error') showUserError(elementId, title, detail, opts);
        else if (level === 'warning') showUserWarning(elementId, title, detail);
        else showUserInfo(elementId, title, detail);
    } else {
        console.warn(`${title}: ${detail}`);
    }
}

function displaySuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = message;
        element.className = "status success";
    }
}

// === Global loading helpers ===
let _loaderCount = 0;
function showGlobalLoader(message = "Loading...") {
    const overlay = document.getElementById("globalLoader");
    const text = document.getElementById("globalLoaderText");
    if (!overlay) return;
    if (text) text.innerText = message;
    _loaderCount++;
    overlay.hidden = false;
}
function hideGlobalLoader() {
    const overlay = document.getElementById("globalLoader");
    if (!overlay) return;
    _loaderCount = Math.max(0, _loaderCount - 1);
    if (_loaderCount === 0) overlay.hidden = true;
}
/**
 * Run a task with the global loader visible.
 * Usage: await runWithLoading("Loading pools...", () => loadPools());
 */
async function runWithLoading(message, fn) {
    showGlobalLoader(message);
    try {
        return await fn();
    } finally {
        hideGlobalLoader();
    }
}
// === end loading helpers ===

// ======= NEW: User-friendly message helpers =======
function showUserError(elementId, title, detail, opts = {}) {
    // opts: { suggestReload: true, suggestReconnect: false, suggestWait: false }
    const el = document.getElementById(elementId);
    if (!el) return;
    const suggestReload = opts.suggestReload !== false;
    const suggestReconnect = !!opts.suggestReconnect;
    const suggestWait = !!opts.suggestWait;
    let html = `<div class="user-message user-error"><strong>${title}</strong><p>${detail}</p>`;
    if (suggestWait) html += `<p>Please wait a moment — data may still be loading.</p>`;
    if (suggestReload) html += `<p>If this continues, try reloading the page.</p>`;
    if (suggestReconnect) html += `<p>Also try reconnecting your wallet or switching networks.</p>`;
    html += `</div>`;
    el.innerHTML = html;
    el.className = "status error";
}

function showUserWarning(elementId, title, detail) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `<div class="user-message user-warning"><strong>${title}</strong><p>${detail}</p></div>`;
    el.className = "status warning";
}

function showUserInfo(elementId, title, detail) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = `<div class="user-message user-info"><strong>${title}</strong><p>${detail}</p></div>`;
    el.className = "status";
}
// ======= end helpers =======

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

        // NEW: detect wallet chain and sync selectedNetwork + dropdown
        try {
            const net = await provider.getNetwork();
            const netKey = chainIdToNetwork(net.chainId);
            if (netKey) setSelectedNetworkUI(netKey);
        } catch {}

        displaySuccess("walletStatus", `Connected: ${account}`);
        const walletAddress = document.getElementById("walletAddress");
        if (walletAddress) walletAddress.innerText = `Wallet Address: ${account}`;
        factoryContract = new ethers.Contract(networkConfig[selectedNetwork].factoryAddress, factoryABI, signer);
        // add a provider-backed contract for safe read-only calls
        factoryContractRead = new ethers.Contract(networkConfig[selectedNetwork].factoryAddress, factoryABI, provider);

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

let poolsLoading = false;
async function loadPools() {
    if (poolsLoading) return; // Prevent parallel loads
    poolsLoading = true;
    const poolsDiv = document.getElementById("pools");
    const endedPoolsDiv = document.getElementById("endedPools");
    const select = document.getElementById("selectedPool");
    const manageSelect = document.getElementById("managePool");
    if (!poolsDiv || !endedPoolsDiv || !select || !manageSelect) {
        console.warn("One or more pool display elements not found");
        poolsLoading = false;
        return;
    }
    try {
        // --- NEW: fetch and display factory openFee for everyone (formatted with USDC decimals) ---
        try {
            const factoryAddr = networkConfig[selectedNetwork].factoryAddress;
            const code = await provider.getCode(factoryAddr);
            if (code === "0x") {
                throw new Error(`Factory contract not found at ${factoryAddr} on selected network`);
            }

            // read-only: use provider-backed contract to avoid signer-from issues
            try {
                const usdcDecimals = await getUsdcDecimals();
                const openFee = await factoryContractRead.openFee();
                const openFeeEl = document.getElementById("openFeeDisplay");
                if (openFeeEl) {
                    openFeeEl.innerText = `Pool Open Fee: ${ethers.formatUnits(openFee, usdcDecimals)} USDC`;
                }
            } catch (feeErr) {
                console.warn("Could not read factory openFee (read):", feeErr);
            }

            // get pools using read-only contract
            const pools = await factoryContractRead.getPools();
            poolsDiv.innerHTML = pools.length === 0 ? "<p>No active pools available</p>" : "";
            endedPoolsDiv.innerHTML = "";
            select.innerHTML = '<option value="">Select a Pool</option>';
            manageSelect.innerHTML = '<option value="">Select a Pool</option>';
            const now = Math.floor(Date.now() / 1000);
            let activeCount = 0;
            let hasEndedPools = false;

            // small helper to chunk arrays to avoid RPC rate limits
            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
                return chunks;
            };

            // cache for decimals per reward token
            const decimalsCache = {};

            // process pools in batches
            const poolChunks = chunkArray(pools, 10); // tune batch size (8-12 recommended)
            for (const chunk of poolChunks) {
                // parallelize calls inside this chunk
                const infoPromises = chunk.map(async (poolAddr) => {
                    try {
                        const poolContract = new ethers.Contract(poolAddr, poolABI, provider);
                        // fetch core fields in parallel
                        const [owner, name, startTime, endTime, totalRewards, nftAddr, rewardTokenName, rewardTokenAddr] =
                            await Promise.all([
                                poolContract.owner(),
                                poolContract.name(),
                                poolContract.startTime(),
                                poolContract.endTime(),
                                poolContract.totalRewards(),
                                poolContract.nft(),
                                poolContract.rewardTokenName(),
                                poolContract.rewardToken()
                            ]);
                        // decimals cached per token address
                        let rewardDecimals = 18;
                        if (rewardTokenAddr && rewardTokenAddr !== ethers.ZeroAddress) {
                            if (decimalsCache[rewardTokenAddr] !== undefined) {
                                rewardDecimals = decimalsCache[rewardTokenAddr];
                            } else {
                                try {
                                    const rewardContract = new ethers.Contract(rewardTokenAddr, erc20ABI, provider);
                                    rewardDecimals = await rewardContract.decimals();
                                    decimalsCache[rewardTokenAddr] = rewardDecimals;
                                } catch (decErr) {
                                    decimalsCache[rewardTokenAddr] = 18;
                                }
                            }
                        }
                        const rewardsFormatted = ethers.formatUnits(totalRewards, rewardDecimals);
                        return { poolAddr, owner, name, startTime: Number(startTime), endTime: Number(endTime), totalRewards, nftAddr, rewardTokenName, rewardsFormatted };
                    } catch (e) {
                        return { poolAddr, error: e.message || String(e) };
                    }
                });

                const infos = await Promise.all(infoPromises);

                // render results for this chunk
                for (const info of infos) {
                    if (info.error) {
                        console.warn(`Error processing pool ${info.poolAddr}: ${info.error}`);
                        continue;
                    }
                    try {
                        const { poolAddr, owner, name, startTime, endTime, rewardsFormatted, rewardTokenName } = info;
                        const startDate = new Date(startTime * 1000).toLocaleString();
                        const endDate = new Date(endTime * 1000).toLocaleString();
                        const isEnded = endTime <= now;
                        const isOwner = owner.toLowerCase() === account.toLowerCase();
                        const targetDiv = isEnded ? endedPoolsDiv : poolsDiv;
                        if (!isEnded) {
                            activeCount++;
                            targetDiv.innerHTML += `
        <div class="pool-tile">
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
                        console.warn(`Render error for pool ${info.poolAddr}: ${e.message}`);
                    }
                }

                // small delay between chunks to reduce chance of rate limiting
                await new Promise(res => setTimeout(res, 150));
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
            showUserError("pools", "Unable to load pools", "We couldn't fetch pool information right now. Please check your network and try reloading the page.", { suggestReconnect: true, suggestReload: true });
            showUserWarning("endedPools", "Pools unavailable", "Ended pools could not be loaded at this time.");
        } finally {
            poolsLoading = false;
        }
    } catch (error) {
        console.error('Load pools error:', error);
        showUserError("pools", "Unable to load pools", "We couldn't fetch pool information right now. Please check your network and try reloading the page.", { suggestReconnect: true, suggestReload: true });
        showUserWarning("endedPools", "Pools unavailable", "Ended pools could not be loaded at this time.");
    } finally {
        poolsLoading = false;
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

// Add these global sets to track selection across pages
const selectedStakeNFTs = new Set();
const selectedUnstakeNFTs = new Set();
const selectedStakeBonusNFTs = new Set();

let stakePage = 0;
let unstakePage = 0;
const PAGE_SIZE = 10;

// Add globals to hold full ID lists for select-all across pages
let allUnstakedIds = [];
let allStakedIds = [];
let allBonusUnstakedIds = [];
let allStakedBonusIds = [];

// Helper to render paginated NFTs
function renderNFTPage(nfts, container, page, selectedSet, checkboxClass, type) {
    container.innerHTML = "";
    const start = page * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, nfts.length);
    for (let i = start; i < end; i++) {
        const nft = nfts[i];
        const idStr = String(nft.id);
        container.innerHTML += `
            <div class="nft-item">
                <input type="checkbox" class="${checkboxClass}" data-id="${idStr}" ${selectedSet.has(idStr) ? "checked" : ""}>
                <p>Token ID: ${idStr}</p>
            </div>`;
    }
    const totalPages = Math.max(1, Math.ceil(nfts.length / PAGE_SIZE));
    container.innerHTML += `
        <div style="margin-top:10px;">
            <button id="${type}PrevPage" class="button" ${page === 0 ? "disabled" : ""}>Previous</button>
            <span> Page ${page + 1} / ${totalPages} </span>
            <button id="${type}NextPage" class="button" ${end >= nfts.length ? "disabled" : ""}>Next</button>
        </div>`;

    // Attach listeners to the buttons on every render so they persist across re-renders
    const prevBtn = container.querySelector(`#${type}PrevPage`);
    const nextBtn = container.querySelector(`#${type}NextPage`);
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (type === 'stake') {
                stakePage = Math.max(0, stakePage - 1);
                renderNFTPage(nfts, container, stakePage, selectedSet, checkboxClass, type);
            } else if (type === 'unstake') {
                unstakePage = Math.max(0, unstakePage - 1);
                renderNFTPage(nfts, container, unstakePage, selectedSet, checkboxClass, type);
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (type === 'stake') {
                const maxPage = Math.max(0, Math.ceil(nfts.length / PAGE_SIZE) - 1);
                stakePage = Math.min(maxPage, stakePage + 1);
                renderNFTPage(nfts, container, stakePage, selectedSet, checkboxClass, type);
            } else if (type === 'unstake') {
                const maxPage = Math.max(0, Math.ceil(nfts.length / PAGE_SIZE) - 1);
                unstakePage = Math.min(maxPage, unstakePage + 1);
                renderNFTPage(nfts, container, unstakePage, selectedSet, checkboxClass, type);
            }
        });
    }
}

// Update loadNFTs to use pagination and global selection
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
    if (Object.values(elements).some(el => !el)) return;

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
        // Check pool contract exists
        const code = await provider.getCode(poolAddr);
        if (code === "0x") {
            console.warn(`No code at ${poolAddr}`);
            showUserError("nfts", "Pool not found", "The selected pool contract was not found on the current network. Try switching networks or reloading the page.", { suggestReconnect: true, suggestReload: true });
            elements.stakeNFTs.disabled = true;
            return;
        }
        const poolContract = new ethers.Contract(poolAddr, poolABI, provider);

        // Defensive: check account
        if (!isValidAddress(account)) {
            elements.nfts.innerHTML = `<p class="error">Invalid wallet address. Please reconnect your wallet.</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }

        // Defensive: check pool ended
        let endTime;
        try {
            endTime = await poolContract.endTime();
        } catch (e) {
            elements.nfts.innerHTML = `<p class="error">Error loading pool end time: ${e.message}</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }
        const now = Math.floor(Date.now() / 1000);
        if (Number(endTime) <= now) {
            elements.nfts.innerHTML = `<p class="error">Selected pool has ended</p>`;
            elements.stakeNFTs.disabled = true;
            elements.stakeBonusNFTs.disabled = true;
            elements.claimRewards.disabled = true;
            return;
        }

        // Defensive: get NFT contract address
        let nftAddr;
        try {
            nftAddr = await poolContract.nft();
        } catch (e) {
            elements.nfts.innerHTML = `<p class="error">Error loading NFT contract address: ${e.message}</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }
        const nftCode = await provider.getCode(nftAddr);
        if (nftCode === "0x") {
            showUserError("nfts", "NFT contract not found", "We couldn't find the NFT contract for this pool on the network. This can happen if you're on the wrong network. Try switching networks or reloading.", { suggestReconnect: true, suggestReload: true });
            elements.stakeNFTs.disabled = true;
            return;
        }
        const nftContract = new ethers.Contract(nftAddr, erc721ABI, provider);

        // Defensive: check ERC-721 compliance
        let isERC721 = false;
        try {
            isERC721 = await nftContract.supportsInterface("0x80ac58cd");
        } catch (e) {
            showUserError("nfts", "NFT check failed", "The NFT contract did not respond as expected. If NFTs are slow to load, please wait a moment and try again. If the issue persists, reload the page.", { suggestWait: true, suggestReload: true });
            elements.stakeNFTs.disabled = true;
            return;
        }
        if (!isERC721) {
            elements.nfts.innerHTML = `<p class="error">NFT contract at ${nftAddr} does not support ERC-721</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }

        // Defensive: get balance
        let balance = 0n;
        try {
            balance = await nftContract.balanceOf(account);
        } catch (e) {
            elements.nfts.innerHTML = `<p class="error">Error checking NFT balance: ${e.message}</p>`;
            elements.stakeNFTs.disabled = true;
            return;
        }

        // NFT enumeration
        const nfts = [];
        if (balance == 0n) {
            showUserInfo("nfts", "No NFTs found", "You don't own any NFTs from this collection (checked your wallet address). If you think this is wrong, try reconnecting your wallet or switching networks.");
            elements.stakeNFTs.disabled = true;
        } else {
            // Immediately try enumeration for just the first token
            let enumerableSupported = false;
            try {
                await nftContract.tokenOfOwnerByIndex(account, 0);
                enumerableSupported = true;
            } catch (e) {
                enumerableSupported = false;
            }

            if (enumerableSupported) {
                try {
                    for (let i = 0n; i < balance; i++) {
                        const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
                        nfts.push({ id: tokenId });
                    }
                } catch (e) {
                    // If enumeration fails, skip further attempts and go straight to fallback
                    showUserWarning("nftStatus", "Fast enumeration not available", "The contract doesn't support fast listing. We'll perform a fallback scan which may take longer. Please be patient or reload if it stalls.");
                    enumerableSupported = false;
                }
            }

            if (!enumerableSupported) {
                // Fallback: scan up to maxTokenId (default 20002, or use totalSupply if available)
                let maxTokenId = 20003n;
                try {
                    maxTokenId = await nftContract.totalSupply();
                } catch (e) {
                    showUserWarning("nftStatus", "Full supply unknown", "totalSupply() not available on this contract. We'll scan token IDs up to a default upper bound — this can take time. If you own high token IDs, scanning may be slow.");
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
                            nfts.push({ id: result.value.tokenId });
                            foundCount++;
                        }
                    }
                    if (foundCount >= balance) break;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }

        // Defensive: get staked tokens
        let stakedTokens = [];
        try {
            stakedTokens = await poolContract.getUserStakedTokens(account);
        } catch (e) {
            console.warn("getUserStakedTokens failed", e);
            showUserError("nfts", "Couldn't load staked NFTs", "We couldn't retrieve staked NFT data for your account. Try reloading or reconnecting your wallet. If NFTs are still missing, wait a few moments for the fallback scan to finish.");
            elements.stakeNFTs.disabled = true;
            return;
        }

        // Filter out staked NFTs from the list of owned NFTs
        const unstakedNFTs = nfts.filter(nft => !stakedTokens.includes(nft.id));

        // Display only unstaked NFTs in the stake section (paginated)
        const unstakedNFTObjs = unstakedNFTs.map(n => ({ id: n.id }));
        
        // *** set globals so Select All applies to all pages ***
        allUnstakedIds = unstakedNFTObjs.map(n => String(n.id));
        // Wire stake pagination/render
        renderNFTPage(unstakedNFTObjs, elements.nfts, stakePage, selectedStakeNFTs, "nft-checkbox", "stake");
        elements.stakeNFTs.disabled = unstakedNFTObjs.length === 0;

        // Wire stake pagination buttons (these are still fine to leave but primary wiring is inside renderNFTPage)
        const stakePrev = document.getElementById("stakePrevPage");
        const stakeNext = document.getElementById("stakeNextPage");
        if (stakePrev) stakePrev.onclick = () => { stakePage = Math.max(0, stakePage - 1); renderNFTPage(unstakedNFTObjs, elements.nfts, stakePage, selectedStakeNFTs, "nft-checkbox", "stake"); };
        if (stakeNext) stakeNext.onclick = () => { stakePage = Math.min(Math.ceil(unstakedNFTObjs.length / PAGE_SIZE) - 1, stakePage + 1); renderNFTPage(unstakedNFTObjs, elements.nfts, stakePage, selectedStakeNFTs, "nft-checkbox", "stake"); };

        // Display staked NFTs in the unstake section (paginated)
        const stakedObjs = stakedTokens.map(id => ({ id }));
        // set global list for select-all across pages
        allStakedIds = stakedObjs.map(n => String(n.id));
        renderNFTPage(stakedObjs, elements.stakedNFTs, unstakePage, selectedUnstakeNFTs, "staked-nft-checkbox", "unstake");
        const unstakeNFTs = document.getElementById("unstakeNFTs");
        if (unstakeNFTs) unstakeNFTs.disabled = stakedObjs.length === 0;
        elements.claimRewards.disabled = stakedObjs.length === 0;

        // Wire unstake pagination buttons (primary wiring handled in renderNFTPage)
        const unstakePrev = document.getElementById("unstakePrevPage");
        const unstakeNext = document.getElementById("unstakeNextPage");
        if (unstakePrev) unstakePrev.onclick = () => { unstakePage = Math.max(0, unstakePage - 1); renderNFTPage(stakedObjs, elements.stakedNFTs, unstakePage, selectedUnstakeNFTs, "staked-nft-checkbox", "unstake"); };
        if (unstakeNext) unstakeNext.onclick = () => { unstakePage = Math.min(Math.ceil(stakedObjs.length / PAGE_SIZE) - 1, unstakePage + 1); renderNFTPage(stakedObjs, elements.stakedNFTs, unstakePage, selectedUnstakeNFTs, "staked-nft-checkbox", "unstake"); };


        // Calculate pending rewards using contract's earned() if available, else manual per-token calc
        try {
            const rewardTokenAddr = await poolContract.rewardToken();
            const rewardContract = new ethers.Contract(rewardTokenAddr, erc20ABI, provider);
            let rewardDecimals = 18;
            try { rewardDecimals = await rewardContract.decimals(); } catch (e) { console.warn("Could not fetch reward token decimals, defaulting to 18"); }

            let poolBalance = 0n;
            try { poolBalance = await rewardContract.balanceOf(poolAddr); } catch (e) { console.warn("Could not fetch pool reward token balance:", e); }

            let pendingBig = 0n;
            // Prefer contract's earned(account) for accuracy (sums all user pending)
            if (typeof poolContract.earned === 'function') {
                try {
                    const earned = await poolContract.earned(account);
                    pendingBig = BigInt(earned.toString());
                } catch (e) {
                    console.warn("earned() failed, falling back to manual calc:", e);
                    // fall through to manual calc below
                }
            }
            if (pendingBig === 0n) {
                // Manual per-token calc (fallback)
                const rptNow = (typeof poolContract.rewardPerToken === 'function')
                    ? await poolContract.rewardPerToken().catch(() => null)
                    : null;
                for (const tokenId of stakedTokens) {
                    const storedAccum = await poolContract.nftRewards(tokenId).catch(() => 0n);
                    const paid = (typeof poolContract.nftRewardPerTokenPaid === 'function')
                        ? await poolContract.nftRewardPerTokenPaid(tokenId).catch(() => 0n)
                        : 0n;
                    const multiplier = (typeof poolContract.getNFTMultiplier === 'function')
                        ? await poolContract.getNFTMultiplier(account).catch(() => 1n * 10n**18n)
                        : 1n * 10n**18n;
                    let delta = 0n;
                    if (rptNow) {
                        const rNow = BigInt(rptNow.toString());
                        const p = BigInt(paid.toString());
                        if (rNow > p) {
                            delta = ((rNow - p) * BigInt(multiplier.toString())) / BigInt("1000000000000000000");
                        }
                    }
                    pendingBig += BigInt(storedAccum.toString()) + delta;
                }
            }

            // Cap to pool balance (avoid showing impossible amounts)
            const displayPending = (poolBalance && pendingBig > BigInt(poolBalance.toString())) ? BigInt(poolBalance.toString()) : pendingBig;
            elements.pendingRewards.innerHTML = `Pending Rewards: ${ethers.formatUnits(displayPending.toString(), rewardDecimals)}${poolBalance && pendingBig > BigInt(poolBalance.toString()) ? ' (capped by pool balance)' : ''}`;
        } catch (e) {
            elements.pendingRewards.innerHTML = `<span class="warning">Pending Rewards: 0 (contract error)</span>`;
            console.warn("Could not load pending rewards:", e);
        }

        // Bonus NFT logic unchanged (can be refactored similarly if needed)
        const bonusAddr = await poolContract.bonusNFT();
        let bonusNfts = []; 
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
            let bonusMaxTokenId = 20002n;

            if (bonusBalance == 0n) {
                elements.bonusNfts.innerHTML = `<p class="error">No bonus NFTs owned for contract ${bonusAddr} (scanned up to token ID ${bonusMaxTokenId - 1n})</p>`;
                elements.stakeBonusNFTs.disabled = true;
            } else {
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
                            bonusNfts.push({ id: tokenId }); // <-- This line needs bonusNfts to be an array
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
                    elements.bonusNfts.innerHTML += `
        <div class="nft-item">
            <input type="checkbox" class="bonus-nft-checkbox" data-id="${nft.id}">
            <p>Token ID: ${nft.id}</p>
        </div>`;
                }
            }

            const stakedBonusTokens = await poolContract.getUserBonusStakedTokens(account);
            for (const tokenId of stakedBonusTokens) {
                elements.stakedBonusNFTs.innerHTML += `
        <div class="nft-item">
            <input type="checkbox" class="staked-bonus-nft-checkbox" data-id="${tokenId}">
            <p>Token ID: ${tokenId}</p>
        </div>`;
            }
            elements.stakeBonusNFTs.disabled = bonusNfts.length === 0 || stakedBonusTokens.length >= 3;
            const unstakeBonusNFTs = document.getElementById("unstakeBonusNFTs");
            if (unstakeBonusNFTs) unstakeBonusNFTs.disabled = stakedBonusTokens.length === 0;
            const multiplier = await poolContract.getNFTMultiplier(account);
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
        // --- NEW: detect reward token decimals and parse totalRewards accordingly ---
        const rewardContract = new ethers.Contract(rewardToken, erc20ABI, signer);
        let rewardDecimals = 18;
        try {
            rewardDecimals = await rewardContract.decimals();
        } catch (e) {
            console.warn(`Could not fetch reward token decimals for ${rewardToken}: ${e.message}. Defaulting to 18.`);
        }
        const totalRewards = ethers.parseUnits(inputs.totalRewards.value, rewardDecimals);
        // --- END NEW ---
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

        // allowance and approve use rewardContract (already created)
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

        const tokenIds = Array.from(selectedStakeNFTs);
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
        displayError("stakeStatus", error);
    }
}

async function unstakeNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        const tokenIds = Array.from(selectedUnstakeNFTs);
        if (tokenIds.length === 0) throw new Error("No NFTs selected");
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

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
        displayError("stakeStatus", error);
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
        displayError("stakeStatus", error);
    }
}

async function claimAllRewards(event) {
    const claimStatus = document.getElementById("claimStatus");
    if (claimStatus) claimStatus.innerText = "";
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        if (!poolAddr) throw new Error("No pool selected");

        if (!signer) throw new Error("Wallet not connected");

        // Ensure contract is connected with signer so estimateGas / send works
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        // Defensive: check account
        if (!account) {
            const addr = await signer.getAddress().catch(() => null);
            account = addr || account;
        }
        if (!account) throw new Error("No account available");

        // Get the user's staked tokens (normalize to plain strings)
        let stakedRaw = [];
        try {
            stakedRaw = await poolContract.getUserStakedTokens(account);
        } catch (e) {
            console.warn("getUserStakedTokens failed:", e);
            stakedRaw = [];
        }
        const staked = Array.isArray(stakedRaw) ? stakedRaw.map(id => id.toString()) : [];

        if (!staked || staked.length === 0) throw new Error("No staked NFTs to claim for");

        // Get tx fee and check caller balance
        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee: ${ethers.formatEther(txFee)} required`);

        // Check pool has enough reward tokens to cover the claim to avoid revert
        const rewardTokenAddr = await poolContract.rewardToken();
        const rewardContract = new ethers.Contract(rewardTokenAddr, erc20ABI, provider);
        let totalReward = 0n;
        try {
            for (const tid of staked) {
                const r = await poolContract.nftRewards(tid);
                totalReward += BigInt(r.toString());
            }
        } catch (e) {
            console.warn("Failed to sum nftRewards, continuing:", e);
        }
        try {
            const poolRewardBalance = BigInt((await rewardContract.balanceOf(poolAddr)).toString());
            if (totalReward > 0n && poolRewardBalance < totalReward) {
                throw new Error("Pool has insufficient reward balance to satisfy claim");
            }
        } catch (e) {
            // If decimals/reads fail, just warn and continue — the contract will revert if insufficient
            console.warn("Could not validate pool reward balance:", e);
        }

        // Determine and call the proper claim function (always include txFee)
        if (typeof poolContract.claim === "function") {
            const args = staked;
            const gasEstimate = await poolContract.claim.estimateGas(args, { value: txFee });
            const tx = await poolContract.claim(args, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
            claimStatus && (claimStatus.innerText = "Claiming rewards...");
            await tx.wait();
            claimStatus && (claimStatus.innerText = "Claim complete");
            await loadNFTs();
            return;
        }

        if ( typeof poolContract.claimAll === "function") {
            const gasEstimate = await poolContract.claimAll.estimateGas({ value: txFee });
            const tx = await poolContract.claimAll({ value: txFee, gasLimit: gasEstimate * 12n / 10n });
            claimStatus && (claimStatus.innerText = "Claiming rewards...");
            await tx.wait();
            claimStatus && (claimStatus.innerText = "Claim complete");
            await loadNFTs();
            return;
        }

        if (typeof poolContract.claimRewards === "function") {
            // some implementations accept tokenIds or no args
            if (staked.length > 0) {
                const gasEstimate = await poolContract.claimRewards.estimateGas(staked, { value: txFee });
                const tx = await poolContract.claimRewards(staked, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
                claimStatus && (claimStatus.innerText = "Claiming rewards...");
                await tx.wait();
                claimStatus && (claimStatus.innerText = "Claim complete");
                await loadNFTs();
                return;
            } else {
                const gasEstimate = await poolContract.claimRewards.estimateGas({ value: txFee });
                const tx = await poolContract.claimRewards({ value: txFee, gasLimit: gasEstimate * 12n / 10n });
                claimStatus && (claimStatus.innerText = "Claiming rewards...");
                await tx.wait();
                claimStatus && (claimStatus.innerText = "Claim complete");
                await loadNFTs();
                return;
            }
        }

        throw new Error("No claim function found on pool contract (check ABI)");
    } catch (error) {
        console.error("Claim all rewards error:", error);
        if (document.getElementById("claimStatus")) {
            document.getElementById("claimStatus").innerText = `Error: ${error.message}`;
        } else {
            alert(`Claim Error: ${error.message}`);
        }
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

        const tokenIds = Array.from(selectedStakeBonusNFTs);
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
        displayError("stakeStatus", error);
    }
}

async function unstakeBonusNFTs() {
    const stakeStatus = document.getElementById("stakeStatus");
    if (!stakeStatus) return;
    try {
        const poolAddr = document.getElementById("selectedPool")?.value;
        const checkboxes = document.getElementsByClassName("staked-bonus-nft-checkbox");
        const tokenIds = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => ethers.toBigInt(cb.dataset.id));
        if (tokenIds.length === 0) throw new Error("No bonus NFTs selected");
        if (!poolAddr) throw new Error("No pool selected");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

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
        displayError("stakeStatus", error);
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

        // --- NEW: use reward token decimals when parsing amount ---
        let rewardDecimals = 18;
        try {
            rewardDecimals = await rewardContract.decimals();
        } catch (e) {
            console.warn(`Could not read reward token decimals for ${rewardTokenAddr}: ${e.message}. Defaulting to 18.`);
        }
        const amount = ethers.parseUnits(amountInput.value, rewardDecimals);
               // --- END NEW ---

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

        // --- NEW: use reward token decimals when parsing withdraw amount ---
        const rewardTokenAddr = await poolContract.rewardToken();
        const rewardContract = new ethers.Contract(rewardTokenAddr, erc20ABI, signer);
        let rewardDecimals = 18;
        try {
            rewardDecimals = await rewardContract.decimals();
        } catch (e) {
            console.warn(`Could not read reward token decimals for ${rewardTokenAddr}: ${e.message}. Defaulting to 18.`);
        }
        const amount = ethers.parseUnits(amountInput.value, rewardDecimals);
        // --- END NEW ---

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

document.addEventListener("change", (event) => {
    // For staking NFTs
    if (event.target.classList.contains("nft-checkbox")) {
        const tokenId = event.target.dataset.id;
        if (event.target.checked) {
            selectedStakeNFTs.add(tokenId);
        } else {
            selectedStakeNFTs.delete(tokenId);
        }
    }
    // For unstaking NFTs
    if (event.target.classList.contains("staked-nft-checkbox")) {
        const tokenId = event.target.dataset.id;
        if (event.target.checked) {
            selectedUnstakeNFTs.add(tokenId);
        } else {
            selectedUnstakeNFTs.delete(tokenId);
        }
    }
    // For bonus NFTs
    if (event.target.classList.contains("bonus-nft-checkbox")) {
        const tokenId = event.target.dataset.id;
        if (event.target.checked) {
            selectedStakeBonusNFTs.add(tokenId);
        } else {
            selectedStakeBonusNFTs.delete(tokenId);
        }
    }
    if (event.target.classList.contains("staked-bonus-nft-checkbox")) {
        const tokenId = event.target.dataset.id;
        if (event.target.checked) {
            selectedUnstakeNFTs.add(tokenId);
        } else {
            selectedUnstakeNFTs.delete(tokenId);
        }
    }
});

async function setPoolName() {
    const manageStatus = document.getElementById("manageStatus");
    if (!manageStatus) return;
    try {
        const poolAddr = document.getElementById("managePool")?.value;
        const newName = document.getElementById("newPoolName")?.value;
       
        if (!poolAddr || !newName) throw new Error("No pool or new name provided");
        const poolContract = new ethers.Contract(poolAddr, poolABI, signer);

        const txFee = await poolContract.txFee();
        const balance = await provider.getBalance(account);
        if (balance < txFee) throw new Error(`Insufficient balance for tx fee`);

        const gasEstimate = await poolContract.setPoolName.estimateGas(newName, { value: txFee });
        const tx = await poolContract.setPoolName(newName, { value: txFee, gasLimit: gasEstimate * 12n / 10n });
        await tx.wait();
        displaySuccess("manageStatus", "Pool name updated successfully!");
        await loadPools();
    } catch (error) {
        displayError("manageStatus", `Error setting pool name: ${error.message}`);
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
    // Update visible checkboxes as before
    const checkboxes = document.getElementsByClassName(checkboxClass);
    for (const checkbox of checkboxes) {
        checkbox.checked = checked;
    }

    // Determine source list and target selected set to update all pages
    let sourceIds = null;
    let targetSet = null;
    if (checkboxClass === "nft-checkbox") {
        sourceIds = allUnstakedIds;
        targetSet = selectedStakeNFTs;
    } else if (checkboxClass === "staked-nft-checkbox") {
        sourceIds = allStakedIds;
        targetSet = selectedUnstakeNFTs;
    } else if (checkboxClass === "bonus-nft-checkbox") {
        sourceIds = allBonusUnstakedIds;
        targetSet = selectedStakeBonusNFTs;
    } else if (checkboxClass === "staked-bonus-nft-checkbox") {
        sourceIds = allStakedBonusIds;
        targetSet = selectedUnstakeNFTs;
    }

    if (Array.isArray(sourceIds) && sourceIds.length > 0) {
        if (checked) {
            for (const id of sourceIds) targetSet.add(String(id));
        } else {
            for (const id of sourceIds) targetSet.delete(String(id));
        }
    } else {
        // Fallback: update only visible checkboxes (previous behavior)
        for (const checkbox of checkboxes) {
            const tokenId = checkbox.dataset.id;
            if (checkboxClass === "nft-checkbox") {
                if (checked) selectedStakeNFTs.add(tokenId); else selectedStakeNFTs.delete(tokenId);
            }
            if (checkboxClass === "staked-nft-checkbox") {
                if (checked) selectedUnstakeNFTs.add(tokenId); else selectedUnstakeNFTs.delete(tokenId);
            }
            if (checkboxClass === "bonus-nft-checkbox") {
                if (checked) selectedStakeBonusNFTs.add(tokenId); else selectedStakeBonusNFTs.delete(tokenId);
            }
            if (checkboxClass === "staked-bonus-nft-checkbox") {
                if (checked) selectedUnstakeNFTs.add(tokenId); else selectedUnstakeNFTs.delete(tokenId);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    createStars();
    const networkSelect = document.getElementById("networkSelect");
    if (networkSelect) {
        // Initialize from wallet chain if available
        if (window.ethereum && window.ethereum.chainId) {
            const netKey = chainIdToNetwork(window.ethereum.chainId);
            if (netKey) setSelectedNetworkUI(netKey);
            else selectedNetwork = networkSelect.value;
        } else {
            selectedNetwork = networkSelect.value;
        }

        // CHANGE: only request wallet to switch; re-init happens via chainChanged
        networkSelect.addEventListener("change", async (e) => {
            const targetNet = e.target.value;
            await runWithLoading(`Switching to ${targetNet}...`, () => switchNetwork(targetNet));
            // chainChanged will follow and reconnect
        });
    }

    // Buttons -> wrap with loader where applicable
    const connectButton = document.getElementById("connectWallet");
    if (connectButton) connectButton.addEventListener("click", () => runWithLoading("Connecting wallet...", () => connectWallet()));

    const loadPoolsBtn = document.getElementById("loadPools");
    if (loadPoolsBtn) loadPoolsBtn.addEventListener("click", () => runWithLoading("Loading pools...", () => loadPools()));

    const loadMyPoolsBtn = document.getElementById("loadMyPools");
    if (loadMyPoolsBtn) loadMyPoolsBtn.addEventListener("click", () => runWithLoading("Loading your pools...", () => loadMyPools()));

    const deployButton = document.getElementById("deployPool");
    if (deployButton) deployButton.addEventListener("click", () => runWithLoading("Deploying pool...", () => deployPool()));

    const approveButton = document.getElementById("approveNFTs");
    if (approveButton) approveButton.addEventListener("click", () => runWithLoading("Approving NFTs...", () => approveNFTs()));

    const approveBonusButton = document.getElementById("approveBonusNFTs");
    if (approveBonusButton) approveBonusButton.addEventListener("click", () => runWithLoading("Approving bonus NFTs...", () => approveBonusNFTs()));

    const selectAllStake = document.getElementById("selectAllStake");
    if (selectAllStake) selectAllStake.addEventListener("click", () => selectAllNFTs("nft-checkbox", true));

    const selectAllUnstake = document.getElementById("selectAllUnstake");
    if (selectAllUnstake) selectAllUnstake.addEventListener("click", () => selectAllNFTs("staked-nft-checkbox", true));  // Changed false to true

    const selectAllBonusStake = document.getElementById("selectAllBonusStake");
    if (selectAllBonusStake) selectAllBonusStake.addEventListener("click", () => selectAllNFTs("bonus-nft-checkbox", true));

    const selectAllBonusUnstake = document.getElementById("selectAllBonusUnstake");
    if (selectAllBonusUnstake) selectAllBonusUnstake.addEventListener("click", () => selectAllNFTs("staked-bonus-nft-checkbox", true));  // Changed false to true

    const stakeButton = document.getElementById("stakeNFTs");
    if (stakeButton) stakeButton.addEventListener("click", () => runWithLoading("Staking NFTs...", () => stakeNFTs()));

    const stakeBonusButton = document.getElementById("stakeBonusNFTs");
    if (stakeBonusButton) stakeBonusButton.addEventListener("click", () => runWithLoading("Staking bonus NFTs...", () => stakeBonusNFTs()));

    const unstakeButton = document.getElementById("unstakeNFTs");
    if (unstakeButton) unstakeButton.addEventListener("click", () => runWithLoading("Unstaking NFTs...", () => unstakeNFTs()));

    const unstakeBonusButton = document.getElementById("unstakeBonusNFTs");
    if (unstakeBonusButton) unstakeBonusButton.addEventListener("click", () => runWithLoading("Unstaking bonus NFTs...", () => unstakeBonusNFTs()));

    const claimButton = document.getElementById("claimRewards");
    if (claimButton) claimButton.addEventListener("click", () => runWithLoading("Claiming rewards...", () => claimRewards()));

    const claimAllButton = document.getElementById("claimAllRewards");
    if (claimAllButton) claimAllButton.addEventListener("click", () => runWithLoading("Claiming all rewards...", () => claimAllRewards()));

    const addRewardsButton = document.getElementById("addRewards");
    if (addRewardsButton) addRewardsButton.addEventListener("click", () => runWithLoading("Adding rewards...", () => addRewards()));

    const withdrawExcessButton = document.getElementById("withdrawExcessRewards");
    if (withdrawExcessButton) withdrawExcessButton.addEventListener("click", () => runWithLoading("Withdrawing rewards...", () => withdrawExcessRewards()));

    const endPoolButton = document.getElementById("endPool");
    if (endPoolButton) endPoolButton.addEventListener("click", () => runWithLoading("Ending pool...", () => endPool()));

    const withdrawRemainingButton = document.getElementById("withdrawRemaining");
    if (withdrawRemainingButton) withdrawRemainingButton.addEventListener("click", () => runWithLoading("Withdrawing remaining...", () => withdrawRemaining()));

    const setEndTimeButton = document.getElementById("setEndTime");
    if (setEndTimeButton) setEndTimeButton.addEventListener("click", () => runWithLoading("Updating end time...", () => setEndTime()));

    const setRewardTokenNameButton = document.getElementById("setRewardTokenName");
    if (setRewardTokenNameButton) setRewardTokenNameButton.addEventListener("click", () => runWithLoading("Updating reward name...", () => setRewardTokenName()));

    const setBonusNFTButton = document.getElementById("setBonusNFT");
    if (setBonusNFTButton) setBonusNFTButton.addEventListener("click", () => runWithLoading("Setting bonus NFT...", () => setBonusNFT()));

    const setPoolImageButton = document.getElementById("setPoolImage");
    if (setPoolImageButton) setPoolImageButton.addEventListener("click", () => runWithLoading("Updating pool image...", () => setPoolImage()));

    const setPoolNameButton = document.getElementById("setPoolName");
    if (setPoolNameButton) setPoolNameButton.addEventListener("click", () => runWithLoading("Updating pool name...", () => setPoolName()));

    const withdrawNativeButton = document.getElementById("withdrawNative");
    if (withdrawNativeButton) withdrawNativeButton.addEventListener("click", () => runWithLoading("Withdrawing native...", () => withdrawNativeAdmin()));

    const withdrawUsdcButton = document.getElementById("withdrawUsdc");
    if (withdrawUsdcButton) withdrawUsdcButton.addEventListener("click", () => runWithLoading("Withdrawing USDC...", () => withdrawUsdcAdmin()));

    const setOpenFeeButton = document.getElementById("setOpenFee");
    if (setOpenFeeButton) setOpenFeeButton.addEventListener("click", () => runWithLoading("Setting open fee...", () => setOpenFee()));

    const setTxFeeButton = document.getElementById("setTxFee");
    if (setTxFeeButton) setTxFeeButton.addEventListener("click", () => runWithLoading("Setting tx fee...", () => setTxFee()));

    const setExemptButton = document.getElementById("setExempt");
    if (setExemptButton) setExemptButton.addEventListener("click", () => runWithLoading("Updating exemption...", () => setExempt()));

    const selectedPool = document.getElementById("selectedPool");
    if (selectedPool) selectedPool.addEventListener("change", () => runWithLoading("Loading NFTs...", () => loadNFTs()));

    // ===== NEW: Add event listeners for toggle buttons =====
    document.getElementById("toggleAvailablePools")?.addEventListener("click", () => toggleSection("poolsContent", "toggleAvailablePools"));
    document.getElementById("toggleStakeSection")?.addEventListener("click", () => toggleSection("stakeContent", "toggleStakeSection"));
    document.getElementById("toggleUnstakeSection")?.addEventListener("click", () => toggleSection("unstakeContent", "toggleUnstakeSection"));
    document.getElementById("toggleDeploySection")?.addEventListener("click", () => toggleSection("deployContent", "toggleDeploySection"));
    document.getElementById("toggleMyPools")?.addEventListener("click", () => toggleSection("myPoolsContent", "toggleMyPools"));
    document.getElementById("toggleManageSection")?.addEventListener("click", () => toggleSection("manageContent", "toggleManageSection"));
    document.getElementById("toggleAdminSection")?.addEventListener("click", () => toggleSection("adminContent", "toggleAdminSection"));
    document.getElementById("toggleEndedPools")?.addEventListener("click", () => toggleSection("endedPoolsContent", "toggleEndedPools"));
    // ===== END NEW =====

    // Modal close handlers (for howToUseModal)
    document.getElementById("howToUseClose")?.addEventListener("click", () => closeModal("howToUseModal"));
    document.getElementById("howToUseModal")?.addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.hasAttribute('data-close-modal')) closeModal("howToUseModal");
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !document.getElementById("howToUseModal")?.hidden) closeModal("howToUseModal");
    });

    // Handle MetaMask network/account changes
    if (window.ethereum) {
        window.ethereum.on('chainChanged', async (chainId) => {
            const netKey = chainIdToNetwork(chainId);
            if (!netKey) {
                displayError("walletStatus", "Unsupported network selected in wallet. Please switch to Cronos or Polygon.");
                signer = null; account = null;
                return;
            }
            setSelectedNetworkUI(netKey);
            signer = null; account = null;
            const name = netKey === 'polygon' ? 'Polygon' : 'Cronos';
            promptReconnect(name);
            try {
                provider = new ethers.BrowserProvider(window.ethereum);
                factoryContractRead = new ethers.Contract(networkConfig[selectedNetwork].factoryAddress, factoryABI, provider);
            } catch (e) {
                displayError("walletStatus", e);
                return;
            }
            try {
                await runWithLoading(`Reconnecting on ${name}...`, () => connectWallet());
            } catch (e) {
                displayError("walletStatus", e);
            }
        });
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                account = accounts[0];
                displaySuccess("walletStatus", `Connected: ${account}`);
                const walletAddress = document.getElementById("walletAddress");
                if (walletAddress) walletAddress.innerText = `Wallet Address: ${account}`;
                (async () => {
                    try {
                        if (provider) {
                            signer = await provider.getSigner();
                        }
                        await runWithLoading("Refreshing pools...", () => loadPools());
                        await runWithLoading("Refreshing my pools...", () => loadMyPools());
                    } catch (e) {
                        console.warn("accountsChanged refresh failed:", e);
                    }
                })();
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

async function fetchIpfsJson(ipfsUri) {
    if (!ipfsUri.startsWith("ipfs://")) return null;
    const cid = ipfsUri.slice(7);
    for (const gateway of ipfsGateways) {
        try {
            const res = await fetch(gateway + cid, { method: "GET" });
            if (res.ok) return await res.json();
        } catch (e) {
            // Try next gateway
        }
    }
    return null;
}

async function getIpfsImageUrl(ipfsUri) {
    if (!ipfsUri.startsWith("ipfs://")) return ipfsUri;
    const cid = ipfsUri.slice(7);
    for (const gateway of ipfsGateways) {
        try {
            // Optionally, check if the image exists
            const res = await fetch(gateway + cid, { method: "HEAD" });
            if (res.ok) return gateway + cid;
        } catch (e) {
            // Try next gateway
        }
    }
    // Fallback to first gateway
    return ipfsGateways[0] + cid;
}

// --- NEW: inspectPoolSafe function ---
async function inspectPoolSafe(poolAddr, accountAddr) {
    try {
        if (!provider) throw new Error("Provider not initialized (connect wallet first).");
        if (!poolAddr) throw new Error("No pool address provided.");
        poolAddr = String(poolAddr).trim().replace(/^<|>$/g, "");
        accountAddr = accountAddr ? String(accountAddr).trim().replace(/^<|>$/g, "") : account;
        try { poolAddr = ethers.getAddress(poolAddr); } catch (e) { throw new Error("Invalid pool address: " + poolAddr); }
        try { accountAddr = ethers.getAddress(accountAddr); } catch (e) { throw new Error("Invalid account address: " + accountAddr); }

        const pool = new ethers.Contract(poolAddr, poolABI, provider);

        // Reward token + decimals
        const rewardAddr = await pool.rewardToken();
        const reward = new ethers.Contract(rewardAddr, erc20ABI, provider);
        const decimals = Number(await reward.decimals().catch(()=>18));
        const totalRewards = await pool.totalRewards();
        const poolBalance = await reward.balanceOf(poolAddr);

        // Try several possible names for a "total staked" getter (frontend-friendly)
        const totalCandidates = ['totalNFTsStaked','totalStaked','totalSupply','totalStakedNFTs','totalStakedTokens','totalNftStaked','totalTokensStaked'];
        let totalNFTs = null;
        let usedTotalFn = null;
        for (const fn of totalCandidates) {
            if (typeof pool[fn] === 'function') {
                try {
                    totalNFTs = await pool[fn]();
                    usedTotalFn = fn;
                    break;
                } catch (e) {
                    console.warn(`Found ${fn} but call failed: ${e.message}`);
                }
            }
        }
        if (usedTotalFn) {
            console.log(`Using ${usedTotalFn}() => ${totalNFTs.toString()}`);
        } else {
            console.log("No total-staked getter found on pool contract (skipping totalNFTsStaked).");
        }

        console.log("reward token:", rewardAddr);
        console.log("decimals:", decimals);
        console.log("totalRewards raw:", totalRewards.toString(), "formatted:", ethers.formatUnits(totalRewards, decimals));
        console.log("poolBalance raw:", poolBalance.toString(), "formatted:", ethers.formatUnits(poolBalance, decimals));
        console.log("totalNFTsStaked (detected):", totalNFTs ? totalNFTs.toString() : "n/a");

        // staked tokens for account
        const staked = (typeof pool.getUserStakedTokens === 'function')
            ? await pool.getUserStakedTokens(accountAddr).catch(()=>[])
            : [];
        console.log("staked tokens for account:", Array.isArray(staked) ? staked.map(x=>x.toString()) : staked);

        let sum = 0n;
        if (Array.isArray(staked) && staked.length > 0) {
            for (const t of staked) {
                const r = await pool.nftRewards(t);
                console.log("nftRewards", t.toString(), "raw:", r.toString(), "formatted:", r ? ethers.formatUnits(r, decimals) : null);
                sum += BigInt(r.toString());
            }
        } else {
            console.log("No staked tokens returned or getUserStakedTokens not present.");
        }
        console.log("sum of nftRewards raw:", sum.toString(), "formatted:", ethers.formatUnits(sum.toString(), decimals));

        // expected distributed so far (if start/end exist)
        if (typeof pool.startTime === "function" && typeof pool.endTime === "function") {
            const start = Number(await pool.startTime());
            const end = Number(await pool.endTime());
            const now = Math.min(Math.floor(Date.now()/1000), end);
            const elapsed = Math.max(0, now - start);
            const duration = end - start;
            if (duration > 0) {
                const expectedDistributed = BigInt(totalRewards.toString()) * BigInt(elapsed) / BigInt(duration);
                console.log("expectedDistributed raw:", expectedDistributed.toString(), "formatted:", ethers.formatUnits(expectedDistributed.toString(), decimals));
            }
        }
    } catch (err) {
        console.error("inspectPoolSafe error:", err.message || err);
    }
}
// ...existing code...
async function debugTokenRewards(poolAddr, tokenId, accountAddr) {
    try {
        if (!provider) throw new Error("Provider not initialized (connect wallet first).");
        poolAddr = String(poolAddr).trim().replace(/^<|>$/g,"");
        tokenId = String(tokenId).trim();
        accountAddr = accountAddr ? String(accountAddr).trim().replace(/^<|>$/g,"") : account;
        poolAddr = ethers.getAddress(poolAddr);
        accountAddr = ethers.getAddress(accountAddr);

        const pool = new ethers.Contract(poolAddr, poolABI, provider);
        const rewardAddr = await (typeof pool.rewardToken === 'function' ? pool.rewardToken() : Promise.resolve(null));
        if (!rewardAddr) throw new Error("Could not read rewardToken from pool");
        const reward = new ethers.Contract(rewardAddr, erc20ABI, provider);
        const decimals = Number(await reward.decimals().catch(()=>18));

        // Defensive calls: only call view methods if they exist on the contract object
        const safeCall = async (contract, fnName, ...args) => {
            try {
                if (typeof contract[fnName] === 'function') {
                    return await contract[fnName](...args);
                }
            } catch (e) {
                console.warn(`Call ${fnName} failed: ${e.message}`);
            }
            return null;
        };

        const rpStored = await safeCall(pool, 'rewardPerTokenStored');
        const rptNow = await safeCall(pool, 'rewardPerToken');
        const lastUpdate = await safeCall(pool, 'lastUpdateTime');
        const totalNFTs = await safeCall(pool, 'totalNFTsStaked');
        const totalRewards = await safeCall(pool, 'totalRewards');
        const poolBal = await reward.balanceOf(poolAddr).catch(()=>null);
        const nftPaid = await safeCall(pool, 'nftRewardPerTokenPaid', tokenId);
        const nftReward = await safeCall(pool, 'nftRewards', tokenId);
        const multiplier = await safeCall(pool, 'getNFTMultiplier', accountAddr);
        const start = await safeCall(pool, 'startTime');
        const end = await safeCall(pool, 'endTime');

        console.log("==== DEBUG token rewards ====");
        console.log("pool:", poolAddr);
        console.log("tokenId:", tokenId);
        console.log("reward token:", rewardAddr, "decimals:", decimals);
        console.log("startTime:", start && Number(start), "endTime:", end && Number(end));
        console.log("lastUpdateTime:", lastUpdate && Number(lastUpdate));
        console.log("rewardPerTokenStored (raw):", rpStored && rpStored.toString());
        console.log("rewardPerToken() (raw):", rptNow && rptNow.toString());
        console.log("nftRewardPerTokenPaid[token] raw:", nftPaid && nftPaid.toString());
        console.log("nftRewards[token] raw:", nftReward && nftReward.toString(), "formatted:", nftReward ? ethers.formatUnits(nftReward, decimals) : null);
        console.log("getNFTMultiplier(account) raw:", multiplier && multiplier.toString());
        console.log("totalRewards raw:", totalRewards && totalRewards.toString(), "formatted:", totalRewards ? ethers.formatUnits(totalRewards, decimals) : null);
        console.log("pool token balance raw:", poolBal && poolBal.toString(), "formatted:", poolBal ? ethers.formatUnits(poolBal, decimals) : null);
        console.log("totalNFTsStaked (detected):", totalNFTs ? totalNFTs.toString() : "n/a");
        console.log("rewardPerToken() formatted (divide by 1e18 for human):", rptNow ? (Number(rptNow.toString()) / 1e18) : null);
        console.log("==== end debug ====");
        return {
            rpStored, rptNow, lastUpdate, totalNFTs, totalRewards, poolBal, nftPaid, nftReward, multiplier, start, end
        };
    } catch (err) {
        console.error("debugTokenRewards error:", err.message || err);
        throw err;
    }
}

function formatErrorMessage(error) {
    let raw = "";
    let code = null;
    if (!error) raw = "Unknown error";
    else if (typeof error === "string") raw = error;
    else if (error instanceof Error) raw = error.message || String(error);
    else if (typeof error === "object") {
        if (error.error && error.error.message) raw = error.error.message;
        else if (error.reason) raw = error.reason;
        else if (error.message) raw = error.message;
        else raw = JSON.stringify(error);
        if (error.code) code = String(error.code);
    } else {
        raw = String(error);
    }
    const low = raw.toLowerCase();

    // Transaction rejected by user
    if (low.includes("user denied") || low.includes("user rejected") || low.includes("ethers-user-denied") || low.includes("4001") || low.includes("action_rejected")) {
        return {
            title: "Transaction Rejected",
            detail: "You rejected the transaction in your wallet. If this was a mistake, please try again and confirm the transaction in your wallet popup.",
            level: "error",
            opts: { suggestReload: false, suggestReconnect: false, suggestWait: false }
        };
    }
    // Contract call failed
    if (low.includes("missing revert data") || low.includes("call_exception") || low.includes("revert") || low.includes("execution reverted")) {
        return {
            title: "Contract Call Failed",
            detail: "A contract call failed. This may be due to network congestion, contract issues, or invalid input. Try reloading the page, switching networks, or waiting a moment before retrying.",
            level: "error",
            opts: { suggestReload: true, suggestReconnect: true, suggestWait: true }
        };
    }
    // Insufficient funds
    if (low.includes("insufficient funds") || low.includes("insufficient balance") || low.includes("insufficient funds for gas")) {
        return {
            title: "Insufficient Balance",
            detail: "Your wallet balance is too low to complete this action (including transaction fees). Please add funds and try again.",
            level: "error",
            opts: { suggestReload: false, suggestReconnect: false, suggestWait: false }
        };
    }
    // RPC rate limiting
    if (low.includes("rate limit") || low.includes("rate limited") || low.includes("429")) {
        return {
            title: "RPC Rate Limited",
            detail: "The RPC node is rate-limiting requests. Please wait a minute and try again. For faster results, reduce simultaneous actions or switch to a different RPC.",
            level: "warning",
            opts: { suggestReload: false, suggestReconnect: true, suggestWait: true }
        };
    }
    // NFT enumeration fallback
    if (low.includes("totalSupply not supported") || low.includes("enumeration failed") || low.includes("fast enumeration not available")) {
        return {
            title: "NFT Listing Not Available",
            detail: "This NFT contract doesn't support fast listing. The app will perform a fallback scan which can take longer. Please be patient. If NFTs are still missing after a while, reload the page.",
            level: "warning",
            opts: { suggestReload: true, suggestWait: true }
        };
    }
    // Generic fallback
    return {
        title: "Error",
        detail: raw,
        level: "error",
        opts: { suggestReload: true, suggestReconnect: true, suggestWait: false }
    };
}

window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason || "Unhandled promise rejection";
    displayError("walletStatus", reason);
});
window.addEventListener('error', (ev) => {
    displayError("walletStatus", ev.error || ev.message || ev);
});

// ===== NEW: chainId <-> network helpers and re-init =====
function normalizeChainIdHex(chainId) {
    if (typeof chainId === 'bigint') return '0x' + chainId.toString(16);
    if (typeof chainId === 'number') return '0x' + chainId.toString(16);
    if (typeof chainId === 'string') return chainId.toLowerCase();
    return '';
}

function chainIdToNetwork(chainId) {
    const hex = normalizeChainIdHex(chainId);
    if (hex === networkConfig.cronos.chainId) return 'cronos';
    if (hex === networkConfig.polygon.chainId) return 'polygon';
    if (hex === networkConfig.monad.chainId) return 'monad';
    // numeric fallbacks
    if (hex === '0x19') return 'cronos';   // 25
    if (hex === '0x89') return 'polygon';  // 137
    if (hex === '0x8f') return 'monad';    // 143
    return null;
}

function setSelectedNetworkUI(netKey) {
    selectedNetwork = netKey;
    const sel = document.getElementById('networkSelect');
    if (sel && sel.value !== netKey) sel.value = netKey;
    const name = netKey === 'polygon' ? 'Polygon' : netKey === 'monad' ? 'Monad' : 'Cronos';
    displaySuccess('walletStatus', `Switched to ${name}`);
}

// Optional: small helper to prompt reconnection in the status area
function promptReconnect(name) {
    const el = document.getElementById('walletStatus');
    if (!el) return;
    el.className = 'status warning';
    el.innerHTML = `
        <div class="user-message user-warning">
            <strong>Network changed to ${name}.</strong>
            <p>Please reconnect your wallet on this network to continue.</p>
        </div>`;
}

// --- NEW: reinitForNetwork with improved flow ---
async function reinitForNetwork(netKey) {
    try {
        if (!window.ethereum) return;
        setSelectedNetworkUI(netKey);

        // Rebuild provider/signer and contracts for the new network
        provider = new ethers.BrowserProvider(window.ethereum);
        // signer may fail if not connected yet; keep optional
        try { signer = await provider.getSigner(); account = await signer.getAddress(); } catch (_) {}

        factoryContract = signer
            ? new ethers.Contract(networkConfig[selectedNetwork].factoryAddress, factoryABI, signer)
            : null;
        factoryContractRead = new ethers.Contract(networkConfig[selectedNetwork].factoryAddress, factoryABI, provider);

        // Refresh UI data
        await loadPools().catch(e => console.warn('loadPools on reinit:', e));
        if (account) {
            await loadMyPools().catch(e => console.warn('loadMyPools on reinit:', e));
            // Show admin section if caller is factory owner
            try {
                const owner = await factoryContractRead.owner();
                const adminSection = document.getElementById("adminSection");
                if (owner && account && owner.toLowerCase() === account.toLowerCase()) {
                    if (adminSection) adminSection.style.display = "block";
                    await loadAdminData();
                } else {
                    if (adminSection) adminSection.style.display = "none";
                }
            } catch {}
        }

        // If a pool is currently selected, refresh its NFTs view
        const selPool = document.getElementById('selectedPool');
        if (selPool && selPool.value) {
            await loadNFTs().catch(e => console.warn('loadNFTs on reinit:', e));
        }
    } catch (e) {
        displayError('walletStatus', e);
    }
}
