import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from "react";
import { ethers } from "ethers";
import "./App.css";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const GAME_CARD_ADDRESS = "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";
const MARKETPLACE_ADDRESS = "0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5";

const GAME_CARD_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getCard(uint256 tokenId) view returns (tuple(string name, string description, string rarity, uint256 attack, uint256 defense))",
  "function approve(address to, uint256 tokenId)",
  "function transferFrom(address from, address to, uint256 tokenId)",
];

const MARKETPLACE_ABI = [
  "function listings(uint256 tokenId) view returns (address seller, uint256 price)",
  "function buyCard(uint256 tokenId) payable",
  "function listCard(uint256 tokenId, uint256 price)",
  "function unlistCard(uint256 tokenId)",
  "event CardListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event CardSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event CardUnlisted(uint256 indexed tokenId, address indexed seller)",
];

export type Card = {
  tokenId: number;
  name: string;
  description: string;
  rarity: string;
  attack: number;
  defense: number;
  image: string;
  owner: string;
  listed: boolean;
  price: string;
};

export type Activity = {
  type: "LISTED" | "SOLD" | "UNLISTED";
  tokenId: number;
  cardName: string;
  price: string;
  seller: string;
  buyer?: string;
  transactionHash: string;
  blockNumber: number;
};

export type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "pending";
  txHash?: string;
};

const CARD_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const IMAGE_CIDS: Record<number, string> = {
  1: "bafybeie5n5h7c3647uxedsvccpsjcxiopypco2m73wpycaim3ryogay32i",
  2: "bafybeibhlv3ufcjypbkkcokjou5r4xts6bfkbadjoup2r3o3ux44uqnezu",
  3: "bafybeihlpj72kwdp64pdulcfqnqtuzcisbxwoypv2t3abe4dt4ozq3jqp4",
  4: "bafybeiaxtvmovwtimgbwh6l44f7m3skmk3ppucoi2gixowrv2xprijpbj4",
  5: "bafybeifyzu43n22qhrkkkzocbskwgla54ql2b2s6hbjfr7bxcer6z7f6qa",
  6: "bafybeienflcflx7rzrxzh5q47dhnw4a7lpoj5d7wbhyadoehkjxfwzh6z4",
  7: "bafybeicxjtok6ai4nov3bsl5cfay3qkh4nevq2jocfwhvx6u27bniz2w24",
  8: "bafybeieqizupo4bzh63pjqfwj3bimwiwqdsfpa64h7qyusxt6k3tbj5koe",
  9: "bafybeiex4zb6h46ot24burtagm46imuxvp2ymij6ta6thckitq2o75bl5e",
  10: "bafybeib6szx2jv7tx542qnlvovhf5763h7rwnwlfcbe5a7wvsdryhjuiji",
};

const ELEMENT_INFO: Record<number, { name: string; icon: string; bg: string }> = {
  1: { name: "Fire", icon: "🔥", bg: "rgba(249, 115, 22, 0.15)" },
  2: { name: "Shadow", icon: "🗡️", bg: "rgba(168, 85, 247, 0.15)" },
  3: { name: "Lightning", icon: "⚡", bg: "rgba(234, 179, 8, 0.15)" },
  4: { name: "Crystal", icon: "💎", bg: "rgba(6, 182, 212, 0.15)" },
  5: { name: "Void", icon: "🔮", bg: "rgba(236, 72, 153, 0.15)" },
  6: { name: "Inferno", icon: "🔥", bg: "rgba(239, 68, 68, 0.15)" },
  7: { name: "Frost", icon: "❄️", bg: "rgba(56, 189, 248, 0.15)" },
  8: { name: "Thunder", icon: "⚡", bg: "rgba(245, 158, 11, 0.15)" },
  9: { name: "Blood", icon: "🩸", bg: "rgba(220, 38, 38, 0.15)" },
  10: { name: "Nature", icon: "🌿", bg: "rgba(16, 185, 129, 0.15)" },
};

const IPFS_GATEWAYS = [
  "https://violet-labour-skink-360.mypinata.cloud/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

const PUBLIC_RPC_ENDPOINTS = [
  "https://ethereum-sepolia.publicnode.com",
  "https://rpc.ankr.com/eth_sepolia",
  "https://sepolia.drpc.org",
  "https://rpc.sepolia.org",
];

function ipfsUrl(cid: string, gateway = 0) {
  return IPFS_GATEWAYS[gateway] + cid;
}

function getFallbackProvider() {
  for (const url of PUBLIC_RPC_ENDPOINTS) {
    try {
      return new ethers.JsonRpcProvider(url, 11155111);
    } catch {
      continue;
    }
  }
  return new ethers.JsonRpcProvider("https://ethereum-sepolia.publicnode.com", 11155111);
}

function App() {
  const [account, setAccount] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Modals
  const [sellModalCard, setSellModalCard] = useState<Card | null>(null);
  const [sellPriceInput, setSellPriceInput] = useState("");

  const [transferModalCard, setTransferModalCard] = useState<Card | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<"marketplace" | "collection" | "all" | "activity" | "about">("marketplace");
  const [searchTerm, setSearchTerm] = useState("");
  const [rarityFilter, setRarityFilter] = useState("All");
  const [sortOption, setSortOption] = useState("default");

  // Toast System
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdCounter = useRef(0);
  const loadRequestId = useRef(0);

  function addToast(message: string, type: Toast["type"] = "info", txHash?: string) {
    const id = ++toastIdCounter.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, type, txHash }]);
    if (type !== "pending") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    }
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function getCardName(tokenId: number) {
    const existing = cards.find((card) => card.tokenId === tokenId);
    if (existing) return existing.name;

    const names: Record<number, string> = {
      1: "Flame Dragon",
      2: "Shadow Knight",
      3: "Storm Mage",
      4: "Crystal Golem",
      5: "Void Assassin",
      6: "Inferno Phoenix",
      7: "Frost Titan",
      8: "Thunder Beast",
      9: "Blood Moon Samurai",
      10: "Emerald Guardian",
    };
    return names[tokenId] || `Token #${tokenId}`;
  }

  function rarityClass(rarity: string) {
    return `rarity-${rarity.toLowerCase().replace(/\s+/g, "-")}`;
  }

  function shortenAddress(address: string) {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getCardHistory(tokenId: number) {
    return activities
      .filter((activity) => activity.tokenId === tokenId)
      .sort((a, b) => b.blockNumber - a.blockNumber);
  }

  /*
   * =====================================================
   * LOAD MARKETPLACE ACTIVITY
   * =====================================================
   */
  async function loadActivity() {
    try {
      const provider = window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : getFallbackProvider();

      const gameCard = new ethers.Contract(GAME_CARD_ADDRESS, GAME_CARD_ABI, provider);
      const marketplaceInterface = new ethers.Interface(MARKETPLACE_ABI);
      const history: Activity[] = [];

      let nextPageParams: Record<string, string | number> | null = null;
      let pages = 0;

      do {
        const apiUrl = new URL(
          `https://eth-sepolia.blockscout.com/api/v2/addresses/${MARKETPLACE_ADDRESS}/logs`
        );
        if (nextPageParams) {
          for (const [key, value] of Object.entries(nextPageParams)) {
            apiUrl.searchParams.set(key, String(value));
          }
        }

        const response = await fetch(apiUrl.toString());
        if (!response.ok) break;

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];

        for (const rawLog of items) {
          try {
            const parsed = marketplaceInterface.parseLog({
              topics: rawLog.topics,
              data: rawLog.data,
            });

            if (!parsed) continue;
            const eventName = parsed.name;
            if (eventName !== "CardListed" && eventName !== "CardSold" && eventName !== "CardUnlisted") {
              continue;
            }

            const tokenId = Number(parsed.args.tokenId);
            let cardName = getCardName(tokenId);

            try {
              const card = await gameCard.getCard(tokenId);
              cardName = card.name;
            } catch {}

            const blockNumber = Number(rawLog.block_number ?? 0);
            const transactionHash = String(rawLog.transaction_hash || "");

            if (eventName === "CardListed") {
              history.push({
                type: "LISTED",
                tokenId,
                cardName,
                price: ethers.formatEther(parsed.args.price),
                seller: String(parsed.args.seller),
                transactionHash,
                blockNumber,
              });
            } else if (eventName === "CardSold") {
              history.push({
                type: "SOLD",
                tokenId,
                cardName,
                price: ethers.formatEther(parsed.args.price),
                seller: String(parsed.args.seller),
                buyer: String(parsed.args.buyer),
                transactionHash,
                blockNumber,
              });
            } else {
              history.push({
                type: "UNLISTED",
                tokenId,
                cardName,
                price: "0",
                seller: String(parsed.args.seller),
                transactionHash,
                blockNumber,
              });
            }
          } catch {}
        }

        nextPageParams = payload.next_page_params && typeof payload.next_page_params === "object"
          ? payload.next_page_params
          : null;
        pages += 1;
      } while (nextPageParams && pages < 10);

      const uniqueHistory = Array.from(
        new Map(history.map((item) => [`${item.transactionHash}-${item.type}-${item.tokenId}`, item])).values()
      ).sort((a, b) => b.blockNumber - a.blockNumber);

      setActivities(uniqueHistory);
    } catch {
      await loadActivityRpcFallback();
    }
  }

  async function loadActivityRpcFallback() {
    try {
      const provider = getFallbackProvider();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
      const gameCard = new ethers.Contract(GAME_CARD_ADDRESS, GAME_CARD_ABI, provider);

      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 500_000);

      const fallbackHistory: Activity[] = [];
      const filters = [
        marketplace.filters.CardListed(),
        marketplace.filters.CardSold(),
        marketplace.filters.CardUnlisted(),
      ];

      for (const filter of filters) {
        const events = await marketplace.queryFilter(filter, fromBlock, latestBlock);
        for (const event of events) {
          const log = event as ethers.EventLog;
          const tokenId = Number(log.args.tokenId);
          let cardName = getCardName(tokenId);

          try {
            const card = await gameCard.getCard(tokenId);
            cardName = card.name;
          } catch {}

          if (log.fragment.name === "CardListed") {
            fallbackHistory.push({
              type: "LISTED",
              tokenId,
              cardName,
              price: ethers.formatEther(log.args.price),
              seller: String(log.args.seller),
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });
          } else if (log.fragment.name === "CardSold") {
            fallbackHistory.push({
              type: "SOLD",
              tokenId,
              cardName,
              price: ethers.formatEther(log.args.price),
              seller: String(log.args.seller),
              buyer: String(log.args.buyer),
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });
          } else {
            fallbackHistory.push({
              type: "UNLISTED",
              tokenId,
              cardName,
              price: "0",
              seller: String(log.args.seller),
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
            });
          }
        }
      }

      fallbackHistory.sort((a, b) => b.blockNumber - a.blockNumber);
      setActivities(fallbackHistory);
    } catch {
      setActivities([]);
    }
  }

  /*
   * =====================================================
   * CONNECT / DISCONNECT WALLET
   * =====================================================
   */
  async function connectWallet() {
    try {
      if (!window.ethereum) {
        addToast("Please install MetaMask to interact with MythicForge.", "error");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts.length) return;

      const newAccount = accounts[0];
      setAccount(newAccount);
      addToast(`Connected wallet ${shortenAddress(newAccount)}`, "success");

      await loadCards(newAccount);
      await loadActivity();
    } catch (error) {
      console.error(error);
      addToast("Failed to connect MetaMask wallet.", "error");
    }
  }

  function disconnectWallet() {
    setAccount("");
    addToast("Wallet disconnected.", "info");
  }

  /*
   * =====================================================
   * LOAD CARDS (Parallelized Batch Loading)
   * =====================================================
   */
  async function loadCards(walletAddress?: string) {
    const currentRequest = ++loadRequestId.current;
    try {
      setLoadingCards(true);
      const provider = getFallbackProvider();
      const gameCard = new ethers.Contract(GAME_CARD_ADDRESS, GAME_CARD_ABI, provider);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

      const cardPromises = CARD_IDS.map(async (tokenId) => {
        try {
          const [owner, cardData, listing] = await Promise.all([
            gameCard.ownerOf(tokenId).catch(() => ethers.ZeroAddress),
            gameCard.getCard(tokenId).catch(() => ({
              name: getCardName(tokenId),
              description: "A legendary warrior card forged in MythicForge.",
              rarity: tokenId % 4 === 0 ? "Mythic" : tokenId % 3 === 0 ? "Legendary" : tokenId % 2 === 0 ? "Epic" : "Rare",
              attack: 75 + (tokenId * 5),
              defense: 70 + (tokenId * 4),
            })),
            marketplace.listings(tokenId).catch(() => ({ seller: ethers.ZeroAddress, price: 0n })),
          ]);

          const listed = listing.seller !== ethers.ZeroAddress;
          const imageCID = IMAGE_CIDS[tokenId];
          const image = imageCID ? ipfsUrl(imageCID, 0) : "";

          return {
            tokenId,
            name: cardData.name,
            description: cardData.description,
            rarity: cardData.rarity,
            attack: Number(cardData.attack),
            defense: Number(cardData.defense),
            image,
            owner,
            listed,
            price: listed ? ethers.formatEther(listing.price) : "0",
          } as Card;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(cardPromises);
      const validCards = results.filter((c): c is Card => c !== null);

      if (currentRequest !== loadRequestId.current) return;
      setCards(validCards);

      if (walletAddress) {
        setAccount(walletAddress);
      }
    } catch (error) {
      console.error("Failed to load cards:", error);
    } finally {
      if (currentRequest === loadRequestId.current) {
        setLoadingCards(false);
      }
    }
  }

  /*
   * =====================================================
   * MARKETPLACE ACTIONS (Buy, Sell, Unlist, Transfer)
   * =====================================================
   */
  async function buyCard(tokenId: number) {
    try {
      if (!window.ethereum) {
        addToast("Please install MetaMask to purchase cards.", "error");
        return;
      }

      if (!account) {
        await connectWallet();
        return;
      }

      setActionLoading(true);
      addToast(`Initiating purchase for ${getCardName(tokenId)}...`, "pending");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const listing = await marketplace.listings(tokenId);
      if (listing.seller === ethers.ZeroAddress) {
        addToast("This card is not currently listed.", "error");
        return;
      }

      const price = ethers.formatEther(listing.price);
      const balance = await provider.getBalance(account);

      if (balance < listing.price) {
        addToast(`Insufficient ETH. Needed: ${price} ETH`, "error");
        return;
      }

      const tx = await marketplace.buyCard(tokenId, { value: listing.price });
      addToast("Purchase transaction submitted to Sepolia network...", "pending", tx.hash);

      await tx.wait();
      addToast(`Successfully bought ${getCardName(tokenId)}!`, "success", tx.hash);

      setSelectedCard(null);
      await loadCards(account);
      await loadActivity();
    } catch (error: any) {
      console.error(error);
      if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
        addToast("Transaction cancelled in MetaMask.", "info");
      } else {
        addToast(error?.reason || "Transaction failed. Please check your balance & network.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSellSubmit() {
    if (!sellModalCard) return;

    try {
      if (!window.ethereum) {
        addToast("Please install MetaMask.", "error");
        return;
      }

      if (!account) {
        await connectWallet();
        return;
      }

      if (!sellPriceInput || !sellPriceInput.trim()) {
        addToast("Please enter a valid ETH price.", "error");
        return;
      }

      let price: bigint;
      try {
        price = ethers.parseEther(sellPriceInput.trim());
      } catch {
        addToast("Invalid ETH price entered.", "error");
        return;
      }

      if (price <= 0n) {
        addToast("Price must be greater than 0 ETH.", "error");
        return;
      }

      setActionLoading(true);
      addToast(`Step 1/2: Requesting approval to list ${sellModalCard.name}...`, "pending");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const gameCard = new ethers.Contract(GAME_CARD_ADDRESS, GAME_CARD_ABI, signer);
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const approval = await gameCard.approve(MARKETPLACE_ADDRESS, sellModalCard.tokenId);
      await approval.wait();

      addToast(`Step 2/2: Confirming listing for ${sellPriceInput} ETH...`, "pending");
      const tx = await marketplace.listCard(sellModalCard.tokenId, price);
      await tx.wait();

      addToast(`${sellModalCard.name} listed on Marketplace for ${sellPriceInput} ETH!`, "success", tx.hash);

      setSellModalCard(null);
      setSellPriceInput("");
      setSelectedCard(null);

      await loadCards(account);
      await loadActivity();
    } catch (error: any) {
      console.error(error);
      if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
        addToast("Listing transaction rejected.", "info");
      } else {
        addToast(error?.reason || "Failed to list card.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function unlistCard(tokenId: number) {
    try {
      if (!window.ethereum) return;

      setActionLoading(true);
      addToast("Cancelling listing on Marketplace...", "pending");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      const tx = await marketplace.unlistCard(tokenId);
      await tx.wait();

      addToast("Listing cancelled successfully!", "success", tx.hash);
      setSelectedCard(null);

      await loadCards(account);
      await loadActivity();
    } catch (error) {
      console.error(error);
      addToast("Failed to cancel listing.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTransferSubmit() {
    if (!transferModalCard) return;

    try {
      if (!window.ethereum) {
        addToast("Please install MetaMask.", "error");
        return;
      }

      if (!account) {
        addToast("Connect your wallet first.", "error");
        return;
      }

      const recipient = recipientAddress.trim();
      if (!recipient || !ethers.isAddress(recipient)) {
        addToast("Please enter a valid Ethereum address.", "error");
        return;
      }

      if (recipient.toLowerCase() === account.toLowerCase()) {
        addToast("You cannot transfer a card to yourself.", "error");
        return;
      }

      setActionLoading(true);
      addToast(`Transferring ${transferModalCard.name} to ${shortenAddress(recipient)}...`, "pending");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const gameCard = new ethers.Contract(GAME_CARD_ADDRESS, GAME_CARD_ABI, signer);

      const tx = await gameCard.transferFrom(account, recipient, transferModalCard.tokenId);
      await tx.wait();

      addToast(`${transferModalCard.name} transferred to ${shortenAddress(recipient)}!`, "success", tx.hash);

      setTransferModalCard(null);
      setRecipientAddress("");
      setSelectedCard(null);

      await loadCards(account);
      await loadActivity();
    } catch (error: any) {
      console.error(error);
      if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
        addToast("Transfer rejected.", "info");
      } else {
        addToast(error?.reason || "Transfer failed.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  function imageError(event: SyntheticEvent<HTMLImageElement>, tokenId: number) {
    const image = event.currentTarget;
    const current = Number(image.dataset.gateway || "0");
    const next = current + 1;

    if (next < IPFS_GATEWAYS.length) {
      image.dataset.gateway = String(next);
      image.src = ipfsUrl(IMAGE_CIDS[tokenId], next);
    } else {
      // High-res SVG Fallback Card Graphic
      const name = getCardName(tokenId);
      image.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><circle cx="200" cy="180" r="90" fill="none" stroke="%23818cf8" stroke-width="2" stroke-dasharray="8,8"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%23c084fc" font-size="24" font-weight="900" font-family="sans-serif">${name}</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%2338bdf8" font-size="14" font-weight="700" font-family="sans-serif">MythicForge %23${tokenId}</text></svg>`;
    }
  }

  /*
   * =====================================================
   * INITIALIZATION HOOKS
   * =====================================================
   */
  useEffect(() => {
    async function initialize() {
      await loadActivity();
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length) {
            setAccount(accounts[0]);
            await loadCards(accounts[0]);
          } else {
            await loadCards();
          }
        } catch {
          await loadCards();
        }
      } else {
        await loadCards();
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      loadRequestId.current++;
      setCards([]);
      setSelectedCard(null);

      if (!accounts.length) {
        setAccount("");
        addToast("Wallet disconnected.", "info");
        loadCards();
        return;
      }

      setAccount(accounts[0]);
      addToast(`Switched account to ${shortenAddress(accounts[0])}`, "info");
      loadCards(accounts[0]);
      loadActivity();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  /*
   * =====================================================
   * FILTERING & COMPUTED STATS
   * =====================================================
   */
  function filterCards(input: Card[]) {
    let result = [...input];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(
        (card) =>
          card.name.toLowerCase().includes(search) ||
          card.description.toLowerCase().includes(search) ||
          String(card.tokenId).includes(search)
      );
    }

    if (rarityFilter !== "All") {
      result = result.filter((card) => card.rarity.toLowerCase() === rarityFilter.toLowerCase());
    }

    if (sortOption === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOption === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortOption === "attack-high") {
      result.sort((a, b) => b.attack - a.attack);
    } else if (sortOption === "defense-high") {
      result.sort((a, b) => b.defense - a.defense);
    }

    return result;
  }

  const ownedCards = cards.filter(
    (card) => account && card.owner.toLowerCase() === account.toLowerCase()
  );
  const marketplaceCards = cards.filter((card) => card.listed);

  const visibleMarketplaceCards = filterCards(marketplaceCards);
  const visibleOwnedCards = filterCards(ownedCards);
  const visibleAllCards = filterCards(cards);

  const totalCardsCount = cards.length;
  const userOwnedCount = ownedCards.length;
  const totalMarketplaceCount = marketplaceCards.length;
  const totalPowerRating = ownedCards.reduce((acc, card) => acc + card.attack + card.defense, 0);

  const cardStyle: CSSProperties = {
    cursor: "pointer",
  };

  return (
    <div className="app">
      {/* FLOATING TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <span className="toast-icon">
                {toast.type === "success"
                  ? "✨"
                  : toast.type === "error"
                  ? "🚨"
                  : toast.type === "pending"
                  ? "⏳"
                  : "ℹ️"}
              </span>
              <div>
                <p className="toast-message">{toast.message}</p>
                {toast.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${toast.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="toast-link"
                  >
                    View on Sepolia Etherscan ↗
                  </a>
                )}
              </div>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="header-bar">
        <div className="brand-logo" onClick={() => setActiveTab("marketplace")}>
          <div className="brand-icon">⚔️</div>
          <div>
            <h1>MythicForge</h1>
            <p className="header-subtitle">Decentralized NFT Card Marketplace</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === "marketplace" ? "active" : ""}`}
            onClick={() => setActiveTab("marketplace")}
          >
            🛒 Marketplace <span className="badge">{totalMarketplaceCount}</span>
          </button>
          <button
            className={`nav-tab ${activeTab === "collection" ? "active" : ""}`}
            onClick={() => setActiveTab("collection")}
          >
            🃏 My Collection {account && <span className="badge">{userOwnedCount}</span>}
          </button>
          <button
            className={`nav-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            🎴 All Cards <span className="badge">{totalCardsCount}</span>
          </button>
          <button
            className={`nav-tab ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            📜 Activity
          </button>
          <button
            className={`nav-tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            ℹ️ Contracts
          </button>
        </nav>

        <div className="header-actions">
          <div className="network-pill">
            <span className="dot"></span> Sepolia Testnet
          </div>
          {account ? (
            <div className="wallet-connected-box">
              <span className="wallet-address">{shortenAddress(account)}</span>
              <button className="disconnect-btn" onClick={disconnectWallet} title="Disconnect Wallet">
                Disconnect
              </button>
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet} disabled={actionLoading}>
              Connect MetaMask
            </button>
          )}
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="hero">
        <div className="hero-badge">⚡ Next-Gen Web3 Gaming NFT Marketplace</div>
        <h2>Forge Your Mythic Card Deck</h2>
        <p>Collect, trade, and battle with verifiable ERC-721 NFT cards on Ethereum Sepolia.</p>

        {/* HERO QUICK RARITY CHIPS */}
        <div className="hero-rarity-chips">
          {["All", "Common", "Rare", "Epic", "Legendary", "Mythic"].map((rarity) => (
            <button
              key={rarity}
              className={`chip chip-${rarity.toLowerCase()} ${rarityFilter === rarity ? "active-chip" : ""}`}
              onClick={() => {
                setRarityFilter(rarity);
                if (activeTab !== "marketplace" && activeTab !== "collection" && activeTab !== "all") {
                  setActiveTab("marketplace");
                }
              }}
            >
              {rarity}
            </button>
          ))}
        </div>
        
        <div className="stats-banner">
          <div className="stat-card">
            <span className="stat-label">Total Cards Minted</span>
            <strong className="stat-value">{totalCardsCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Listed on Market</span>
            <strong className="stat-value">{totalMarketplaceCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Your Owned Cards</span>
            <strong className="stat-value">{account ? userOwnedCount : "0"}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Your Deck Power</span>
            <strong className="stat-value">{account ? totalPowerRating : "0"}</strong>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* SEARCH AND FILTERS BAR */}
        {(activeTab === "marketplace" || activeTab === "collection" || activeTab === "all") && (
          <div className="filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search card by name, description, or #ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm("")}>
                  ×
                </button>
              )}
            </div>

            <div className="filter-group">
              <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
                <option value="All">All Rarities</option>
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Epic">Epic</option>
                <option value="Legendary">Legendary</option>
                <option value="Mythic">Mythic</option>
              </select>

              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="default">Sort By Default</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="attack-high">Attack: High → Low</option>
                <option value="defense-high">Defense: High → Low</option>
              </select>

              {(searchTerm || rarityFilter !== "All" || sortOption !== "default") && (
                <button
                  className="reset-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setRarityFilter("All");
                    setSortOption("default");
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loadingCards ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching card data from Sepolia blockchain & IPFS...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: MARKETPLACE */}
            {activeTab === "marketplace" && (
              <section className="tab-section">
                <div className="section-title">
                  <h2>Marketplace Listings</h2>
                  <p>Discover and acquire rare game cards listed by other players.</p>
                </div>

                {visibleMarketplaceCards.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🏷️</span>
                    <h3>No cards currently listed</h3>
                    <p>Be the first to list a card for sale from your collection!</p>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {visibleMarketplaceCards.map((card) => {
                      const element = ELEMENT_INFO[card.tokenId] || { name: "Arcane", icon: "✨", bg: "rgba(255,255,255,0.1)" };
                      return (
                        <div
                          key={card.tokenId}
                          className={`game-card ${rarityClass(card.rarity)}`}
                          style={cardStyle}
                          onClick={() => setSelectedCard(card)}
                        >
                          <div className="card-image-wrapper">
                            <img
                              src={card.image}
                              alt={card.name}
                              data-gateway="0"
                              onError={(e) => imageError(e, card.tokenId)}
                              loading="lazy"
                            />
                            <span className="token-id-badge">#{card.tokenId}</span>
                            <span className={`rarity-badge ${rarityClass(card.rarity)}`}>
                              {card.rarity}
                            </span>
                            <span className="element-badge" style={{ background: element.bg }}>
                              {element.icon} {element.name}
                            </span>
                          </div>

                          <div className="card-body">
                            <h3 className="card-title">{card.name}</h3>
                            <p className="card-desc">{card.description}</p>

                            {/* BATTLE STATS PROGRESS BARS */}
                            <div className="stats-progress-box">
                              <div className="stat-bar-group">
                                <div className="stat-bar-header">
                                  <span>⚔️ ATK</span>
                                  <strong>{card.attack}</strong>
                                </div>
                                <div className="progress-track">
                                  <div className="progress-fill atk-fill" style={{ width: `${Math.min(100, card.attack)}%` }}></div>
                                </div>
                              </div>

                              <div className="stat-bar-group">
                                <div className="stat-bar-header">
                                  <span>🛡️ DEF</span>
                                  <strong>{card.defense}</strong>
                                </div>
                                <div className="progress-track">
                                  <div className="progress-fill def-fill" style={{ width: `${Math.min(100, card.defense)}%` }}></div>
                                </div>
                              </div>
                            </div>

                            <div className="card-footer">
                              <div className="price-tag">
                                <small>Listing Price</small>
                                <strong>{card.price} ETH</strong>
                              </div>

                              {account && card.owner.toLowerCase() === account.toLowerCase() ? (
                                <button
                                  className="action-btn cancel-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unlistCard(card.tokenId);
                                  }}
                                  disabled={actionLoading}
                                >
                                  Cancel List
                                </button>
                              ) : (
                                <button
                                  className="action-btn buy-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    buyCard(card.tokenId);
                                  }}
                                  disabled={actionLoading}
                                >
                                  Buy Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* TAB 2: MY COLLECTION */}
            {activeTab === "collection" && (
              <section className="tab-section">
                <div className="section-title">
                  <h2>My Collection</h2>
                  <p>Manage your owned cards, inspect stats, list cards for sale or transfer.</p>
                </div>

                {!account ? (
                  <div className="empty-state">
                    <span className="empty-icon">🦊</span>
                    <h3>Wallet Not Connected</h3>
                    <p>Connect your MetaMask wallet to view your owned game cards.</p>
                    <button className="connect-btn" onClick={connectWallet} style={{ marginTop: "15px" }}>
                      Connect MetaMask
                    </button>
                  </div>
                ) : visibleOwnedCards.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🃏</span>
                    <h3>No Cards Owned</h3>
                    <p>You don't own any cards matching the search criteria yet.</p>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {visibleOwnedCards.map((card) => {
                      const element = ELEMENT_INFO[card.tokenId] || { name: "Arcane", icon: "✨", bg: "rgba(255,255,255,0.1)" };
                      return (
                        <div
                          key={card.tokenId}
                          className={`game-card ${rarityClass(card.rarity)}`}
                          style={cardStyle}
                          onClick={() => setSelectedCard(card)}
                        >
                          <div className="card-image-wrapper">
                            <img
                              src={card.image}
                              alt={card.name}
                              data-gateway="0"
                              onError={(e) => imageError(e, card.tokenId)}
                              loading="lazy"
                            />
                            <span className="token-id-badge">#{card.tokenId}</span>
                            <span className={`rarity-badge ${rarityClass(card.rarity)}`}>
                              {card.rarity}
                            </span>
                            <span className="element-badge" style={{ background: element.bg }}>
                              {element.icon} {element.name}
                            </span>
                            {card.listed && <span className="listed-tag">Listed ({card.price} ETH)</span>}
                          </div>

                          <div className="card-body">
                            <h3 className="card-title">{card.name}</h3>
                            <p className="card-desc">{card.description}</p>

                            <div className="stats-progress-box">
                              <div className="stat-bar-group">
                                <div className="stat-bar-header">
                                  <span>⚔️ ATK</span>
                                  <strong>{card.attack}</strong>
                                </div>
                                <div className="progress-track">
                                  <div className="progress-fill atk-fill" style={{ width: `${Math.min(100, card.attack)}%` }}></div>
                                </div>
                              </div>

                              <div className="stat-bar-group">
                                <div className="stat-bar-header">
                                  <span>🛡️ DEF</span>
                                  <strong>{card.defense}</strong>
                                </div>
                                <div className="progress-track">
                                  <div className="progress-fill def-fill" style={{ width: `${Math.min(100, card.defense)}%` }}></div>
                                </div>
                              </div>
                            </div>

                            <div className="card-footer-buttons">
                              {card.listed ? (
                                <button
                                  className="action-btn cancel-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unlistCard(card.tokenId);
                                  }}
                                  disabled={actionLoading}
                                >
                                  Cancel Listing
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="action-btn sell-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSellModalCard(card);
                                      setSellPriceInput("");
                                    }}
                                    disabled={actionLoading}
                                  >
                                    Sell Card
                                  </button>
                                  <button
                                    className="action-btn transfer-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTransferModalCard(card);
                                      setRecipientAddress("");
                                    }}
                                    disabled={actionLoading}
                                  >
                                    Transfer
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* TAB 3: ALL CARDS */}
            {activeTab === "all" && (
              <section className="tab-section">
                <div className="section-title">
                  <h2>All Game Cards</h2>
                  <p>Complete directory of all minted cards in the MythicForge universe.</p>
                </div>

                <div className="cards-grid">
                  {visibleAllCards.map((card) => {
                    const element = ELEMENT_INFO[card.tokenId] || { name: "Arcane", icon: "✨", bg: "rgba(255,255,255,0.1)" };
                    return (
                      <div
                        key={card.tokenId}
                        className={`game-card ${rarityClass(card.rarity)}`}
                        style={cardStyle}
                        onClick={() => setSelectedCard(card)}
                      >
                        <div className="card-image-wrapper">
                          <img
                            src={card.image}
                            alt={card.name}
                            data-gateway="0"
                            onError={(e) => imageError(e, card.tokenId)}
                            loading="lazy"
                          />
                          <span className="token-id-badge">#{card.tokenId}</span>
                          <span className={`rarity-badge ${rarityClass(card.rarity)}`}>
                            {card.rarity}
                          </span>
                          <span className="element-badge" style={{ background: element.bg }}>
                            {element.icon} {element.name}
                          </span>
                          {card.listed && <span className="listed-tag">{card.price} ETH</span>}
                        </div>

                        <div className="card-body">
                          <h3 className="card-title">{card.name}</h3>
                          <p className="card-desc">{card.description}</p>

                          <div className="stats-progress-box">
                            <div className="stat-bar-group">
                              <div className="stat-bar-header">
                                <span>⚔️ ATK</span>
                                <strong>{card.attack}</strong>
                              </div>
                              <div className="progress-track">
                                <div className="progress-fill atk-fill" style={{ width: `${Math.min(100, card.attack)}%` }}></div>
                              </div>
                            </div>

                            <div className="stat-bar-group">
                              <div className="stat-bar-header">
                                <span>🛡️ DEF</span>
                                <strong>{card.defense}</strong>
                              </div>
                              <div className="progress-track">
                                <div className="progress-fill def-fill" style={{ width: `${Math.min(100, card.defense)}%` }}></div>
                              </div>
                            </div>
                          </div>

                          <div className="card-owner-info">
                            <small>Owner:</small>{" "}
                            <span>
                              {account && card.owner.toLowerCase() === account.toLowerCase()
                                ? "You"
                                : shortenAddress(card.owner)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TAB 4: RECENT ACTIVITY */}
            {activeTab === "activity" && (
              <section className="tab-section activity-section">
                <div className="section-title">
                  <h2>Marketplace Activity</h2>
                  <p>Real-time transaction history indexed directly from Ethereum Sepolia.</p>
                </div>

                {activities.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📜</span>
                    <h3>No Activity Indexed</h3>
                    <p>No listings or transactions have been recorded on this marketplace yet.</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {activities.map((activity, index) => (
                      <div key={`${activity.transactionHash}-${index}`} className="activity-card">
                        <div className="activity-left">
                          <div className={`activity-badge badge-${activity.type.toLowerCase()}`}>
                            {activity.type === "LISTED"
                              ? "🏷️ LISTED"
                              : activity.type === "SOLD"
                              ? "🛒 SOLD"
                              : "↩️ UNLISTED"}
                          </div>

                          <div className="activity-details">
                            <h4>
                              {activity.cardName} <span className="token-id">#{activity.tokenId}</span>
                            </h4>
                            <p className="activity-addresses">
                              Seller: <code>{shortenAddress(activity.seller)}</code>
                              {activity.buyer && (
                                <>
                                  {" → "}Buyer: <code>{shortenAddress(activity.buyer)}</code>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="activity-right">
                          {activity.type !== "UNLISTED" && (
                            <div className="activity-price">{activity.price} ETH</div>
                          )}
                          <a
                            href={`https://sepolia.etherscan.io/tx/${activity.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="tx-link-btn"
                          >
                            View Tx ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB 5: ABOUT & CONTRACTS */}
            {activeTab === "about" && (
              <section className="tab-section about-section">
                <div className="section-title">
                  <h2>Smart Contracts & Protocol</h2>
                  <p>Verified on-chain infrastructure powering MythicForge on Sepolia.</p>
                </div>

                <div className="info-cards-grid">
                  <div className="info-card">
                    <h3>🃏 GameCard Contract (ERC-721)</h3>
                    <p>Handles card minting, ownership, and metadata attribute storage.</p>
                    <div className="contract-address-box">
                      <code>{GAME_CARD_ADDRESS}</code>
                      <a
                        href={`https://sepolia.etherscan.io/address/${GAME_CARD_ADDRESS}`}
                        target="_blank"
                        rel="noreferrer"
                        className="etherscan-link"
                      >
                        Inspect on Etherscan ↗
                      </a>
                    </div>
                  </div>

                  <div className="info-card">
                    <h3>🛒 Marketplace Contract</h3>
                    <p>Provides trustless escrow, fixed-price card listings, and direct buying.</p>
                    <div className="contract-address-box">
                      <code>{MARKETPLACE_ADDRESS}</code>
                      <a
                        href={`https://sepolia.etherscan.io/address/${MARKETPLACE_ADDRESS}`}
                        target="_blank"
                        rel="noreferrer"
                        className="etherscan-link"
                      >
                        Inspect on Etherscan ↗
                      </a>
                    </div>
                  </div>

                  <div className="info-card">
                    <h3>🌐 IPFS Gateway Integration</h3>
                    <p>High resolution card visual artwork served over decentralized IPFS nodes.</p>
                    <ul className="gateway-list">
                      {IPFS_GATEWAYS.map((gw, i) => (
                        <li key={i}>
                          <code>{gw}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* MODAL 1: CARD DETAILS */}
      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-container card-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedCard(null)}>
              ×
            </button>

            <div className="modal-grid">
              <div className="modal-left-image">
                <img
                  src={selectedCard.image}
                  alt={selectedCard.name}
                  data-gateway="0"
                  onError={(e) => imageError(e, selectedCard.tokenId)}
                />
              </div>

              <div className="modal-right-content">
                <div className="modal-header">
                  <div>
                    <h2>{selectedCard.name}</h2>
                    <span className="token-id">Token ID #{selectedCard.tokenId}</span>
                  </div>
                  <span className={`rarity-badge ${rarityClass(selectedCard.rarity)}`}>
                    {selectedCard.rarity}
                  </span>
                </div>

                <p className="modal-description">{selectedCard.description}</p>

                <div className="modal-stats-grid">
                  <div className="modal-stat-box">
                    <span>Attack Rating</span>
                    <strong>⚔️ {selectedCard.attack} / 100</strong>
                  </div>
                  <div className="modal-stat-box">
                    <span>Defense Rating</span>
                    <strong>🛡️ {selectedCard.defense} / 100</strong>
                  </div>
                  <div className="modal-stat-box">
                    <span>Status</span>
                    <strong className={selectedCard.listed ? "text-listed" : "text-unlisted"}>
                      {selectedCard.listed ? `Listed (${selectedCard.price} ETH)` : "Not Listed"}
                    </strong>
                  </div>
                </div>

                <div className="modal-owner-box">
                  <span>Current Owner Address:</span>
                  <code>{selectedCard.owner}</code>
                </div>

                {/* TRANSACTION HISTORY FOR THIS TOKEN */}
                <div className="token-history-section">
                  <h4>On-Chain History</h4>
                  {getCardHistory(selectedCard.tokenId).length === 0 ? (
                    <p className="no-history">No marketplace activity recorded for this token yet.</p>
                  ) : (
                    <div className="history-timeline">
                      {getCardHistory(selectedCard.tokenId).map((event, i) => (
                        <div key={i} className="timeline-item">
                          <span className="timeline-icon">
                            {event.type === "LISTED" ? "🏷️" : event.type === "SOLD" ? "🛒" : "↩️"}
                          </span>
                          <div>
                            <strong>
                              {event.type} {event.type !== "UNLISTED" && `for ${event.price} ETH`}
                            </strong>
                            <small>
                              Seller: {shortenAddress(event.seller)}
                              {event.buyer && ` | Buyer: ${shortenAddress(event.buyer)}`}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="modal-action-bar">
                  {selectedCard.listed &&
                    account &&
                    selectedCard.owner.toLowerCase() !== account.toLowerCase() && (
                      <button
                        className="action-btn buy-btn"
                        onClick={() => buyCard(selectedCard.tokenId)}
                        disabled={actionLoading}
                      >
                        Buy for {selectedCard.price} ETH
                      </button>
                    )}

                  {account && selectedCard.owner.toLowerCase() === account.toLowerCase() && (
                    <>
                      {selectedCard.listed ? (
                        <button
                          className="action-btn cancel-btn"
                          onClick={() => unlistCard(selectedCard.tokenId)}
                          disabled={actionLoading}
                        >
                          Cancel Listing
                        </button>
                      ) : (
                        <>
                          <button
                            className="action-btn sell-btn"
                            onClick={() => {
                              setSellModalCard(selectedCard);
                              setSellPriceInput("");
                            }}
                            disabled={actionLoading}
                          >
                            Sell Card
                          </button>
                          <button
                            className="action-btn transfer-btn"
                            onClick={() => {
                              setTransferModalCard(selectedCard);
                              setRecipientAddress("");
                            }}
                            disabled={actionLoading}
                          >
                            Transfer Card
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SELL CARD */}
      {sellModalCard && (
        <div className="modal-overlay" onClick={() => !actionLoading && setSellModalCard(null)}>
          <div className="modal-container sell-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSellModalCard(null)} disabled={actionLoading}>
              ×
            </button>

            <h3>List {sellModalCard.name} for Sale</h3>
            <p className="modal-subtitle">Set your listing price in Sepolia ETH.</p>

            <div className="sell-input-group">
              <label>Selling Price (ETH)</label>
              <div className="input-with-symbol">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="e.g. 0.05"
                  value={sellPriceInput}
                  onChange={(e) => setSellPriceInput(e.target.value)}
                  disabled={actionLoading}
                  autoFocus
                />
                <span className="input-symbol">ETH</span>
              </div>
            </div>

            <div className="price-presets">
              <button onClick={() => setSellPriceInput("0.01")} disabled={actionLoading}>0.01 ETH</button>
              <button onClick={() => setSellPriceInput("0.05")} disabled={actionLoading}>0.05 ETH</button>
              <button onClick={() => setSellPriceInput("0.1")} disabled={actionLoading}>0.1 ETH</button>
              <button onClick={() => setSellPriceInput("0.25")} disabled={actionLoading}>0.25 ETH</button>
              <button onClick={() => setSellPriceInput("0.5")} disabled={actionLoading}>0.5 ETH</button>
            </div>

            <div className="modal-form-actions">
              <button
                className="cancel-btn-secondary"
                onClick={() => setSellModalCard(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="confirm-sell-btn"
                onClick={handleSellSubmit}
                disabled={actionLoading || !sellPriceInput}
              >
                {actionLoading ? "Processing..." : "List Card Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TRANSFER CARD */}
      {transferModalCard && (
        <div className="modal-overlay" onClick={() => !actionLoading && setTransferModalCard(null)}>
          <div className="modal-container transfer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setTransferModalCard(null)} disabled={actionLoading}>
              ×
            </button>

            <h3>Transfer {transferModalCard.name}</h3>
            <p className="modal-subtitle">Directly transfer Token #{transferModalCard.tokenId} to another address.</p>

            <div className="transfer-input-group">
              <label>Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                disabled={actionLoading}
                autoFocus
              />
              {recipientAddress && ethers.isAddress(recipientAddress) && (
                <small className="valid-address-tag">✓ Valid EVM Address</small>
              )}
            </div>

            <div className="modal-form-actions">
              <button
                className="cancel-btn-secondary"
                onClick={() => setTransferModalCard(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="confirm-transfer-btn"
                onClick={handleTransferSubmit}
                disabled={actionLoading || !recipientAddress || !ethers.isAddress(recipientAddress)}
              >
                {actionLoading ? "Processing..." : "Transfer Card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer-bar">
        <p>© MythicForge Marketplace. Built for Ethereum Sepolia Testnet.</p>
      </footer>
    </div>
  );
}

export default App;