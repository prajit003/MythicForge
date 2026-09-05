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

const GAME_CARD_ADDRESS =
  "0x2e05C142d522c7b6912017c45b068aE5e064bDb9";

const MARKETPLACE_ADDRESS =
  "0x10eBcaaAbE901DBc33f93Eb2847e455949EC80e5";

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

type Card = {
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

type Activity = {
  type: "LISTED" | "SOLD" | "UNLISTED";
  tokenId: number;
  cardName: string;
  price: string;
  seller: string;
  buyer?: string;
  transactionHash: string;
  blockNumber: number;
};

const CARD_IDS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
];

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

const IPFS_GATEWAYS = [
  "https://violet-labour-skink-360.mypinata.cloud/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

function ipfsUrl(
  cid: string,
  gateway = 0
) {
  return IPFS_GATEWAYS[gateway] + cid;
}

function App() {
  const [account, setAccount] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [activities, setActivities] =
    useState<Activity[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCards, setLoadingCards] =
    useState(false);
  const [selectedCard, setSelectedCard] =
    useState<Card | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [rarityFilter, setRarityFilter] =
    useState("All");

  const [sortOption, setSortOption] =
    useState("default");

  const [transferCardId, setTransferCardId] =
    useState<number | null>(null);

  const [recipientAddress, setRecipientAddress] =
    useState("");

  const loadRequestId = useRef(0);

  function getCardName(tokenId: number) {
    const existing = cards.find(
      (card) => card.tokenId === tokenId
    );

    if (existing) {
      return existing.name;
    }

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
    return `rarity-${rarity
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
  }

  function shortenAddress(address: string) {
    if (!address) {
      return "Unknown";
    }

    return `${address.slice(
      0,
      6
    )}...${address.slice(-4)}`;
  }

  function getCardHistory(tokenId: number) {
    return activities
      .filter(
        (activity) =>
          activity.tokenId === tokenId
      )
      .sort(
        (a, b) =>
          b.blockNumber - a.blockNumber
      );
  }

  /*
   * =====================================================
   * LOAD MARKETPLACE ACTIVITY
   * =====================================================
   */

  async function loadActivity() {
    try {
      if (!window.ethereum) {
        return;
      }

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const gameCard =
        new ethers.Contract(
          GAME_CARD_ADDRESS,
          GAME_CARD_ABI,
          provider
        );

      const marketplaceInterface =
        new ethers.Interface(
          MARKETPLACE_ABI
        );

      const history: Activity[] = [];

      let nextPageParams:
        | Record<
            string,
            string | number
          >
        | null = null;

      let pages = 0;

      /*
       * First attempt:
       * Blockscout v2 logs API
       */

      do {
        const apiUrl = new URL(
          `https://eth-sepolia.blockscout.com/api/v2/addresses/${MARKETPLACE_ADDRESS}/logs`
        );

        if (nextPageParams) {
          for (const [
            key,
            value,
          ] of Object.entries(
            nextPageParams
          )) {
            apiUrl.searchParams.set(
              key,
              String(value)
            );
          }
        }

        const response = await fetch(
          apiUrl.toString()
        );

        if (!response.ok) {
          throw new Error(
            `Activity API returned ${response.status}`
          );
        }

        const payload =
          await response.json();

        const items = Array.isArray(
          payload.items
        )
          ? payload.items
          : [];

        for (const rawLog of items) {
          try {
            const parsed =
              marketplaceInterface.parseLog(
                {
                  topics:
                    rawLog.topics,
                  data: rawLog.data,
                }
              );

            if (!parsed) {
              continue;
            }

            const eventName =
              parsed.name;

            if (
              eventName !==
                "CardListed" &&
              eventName !==
                "CardSold" &&
              eventName !==
                "CardUnlisted"
            ) {
              continue;
            }

            const tokenId = Number(
              parsed.args.tokenId
            );

            let cardName =
              getCardName(tokenId);

            try {
              const card =
                await gameCard.getCard(
                  tokenId
                );

              cardName = card.name;
            } catch {}

            const blockNumber =
              Number(
                rawLog.block_number ??
                  0
              );

            const transactionHash =
              String(
                rawLog.transaction_hash ||
                  ""
              );

            if (
              eventName ===
              "CardListed"
            ) {
              history.push({
                type: "LISTED",
                tokenId,
                cardName,
                price:
                  ethers.formatEther(
                    parsed.args.price
                  ),
                seller: String(
                  parsed.args.seller
                ),
                transactionHash,
                blockNumber,
              });
            } else if (
              eventName ===
              "CardSold"
            ) {
              history.push({
                type: "SOLD",
                tokenId,
                cardName,
                price:
                  ethers.formatEther(
                    parsed.args.price
                  ),
                seller: String(
                  parsed.args.seller
                ),
                buyer: String(
                  parsed.args.buyer
                ),
                transactionHash,
                blockNumber,
              });
            } else {
              history.push({
                type: "UNLISTED",
                tokenId,
                cardName,
                price: "0",
                seller: String(
                  parsed.args.seller
                ),
                transactionHash,
                blockNumber,
              });
            }
          } catch (eventError) {
            console.warn(
              "Skipping unreadable marketplace log:",
              eventError
            );
          }
        }

        nextPageParams =
          payload.next_page_params &&
          typeof payload.next_page_params ===
            "object"
            ? payload.next_page_params
            : null;

        pages += 1;
      } while (
        nextPageParams &&
        pages < 20
      );

      const uniqueHistory =
        Array.from(
          new Map(
            history.map((item) => [
              `${item.transactionHash}-${item.type}-${item.tokenId}`,
              item,
            ])
          ).values()
        );

      uniqueHistory.sort(
        (a, b) =>
          b.blockNumber -
          a.blockNumber
      );

      setActivities(
        uniqueHistory
      );

      console.info(
        `Loaded ${uniqueHistory.length} marketplace activities from Blockscout.`
      );

      return;
    } catch (error) {
      console.error(
        "Blockscout activity loading failed:",
        error
      );
    }

    /*
     * =================================================
     * RPC FALLBACK
     * =================================================
     */

    try {
      if (!window.ethereum) {
        return;
      }

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const marketplace =
        new ethers.Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          provider
        );

      /*
       * FIX:
       * gameCard must also be created inside
       * this fallback scope.
       */

      const gameCard =
        new ethers.Contract(
          GAME_CARD_ADDRESS,
          GAME_CARD_ABI,
          provider
        );

      const latestBlock =
        await provider.getBlockNumber();

      const rangeSize = 50_000;

      const fromBlock = Math.max(
        0,
        latestBlock - 1_000_000
      );

      const fallbackHistory:
        Activity[] = [];

      const filters = [
        marketplace.filters.CardListed(),
        marketplace.filters.CardSold(),
        marketplace.filters.CardUnlisted(),
      ];

      for (
        let startBlock = fromBlock;
        startBlock <= latestBlock;
        startBlock += rangeSize
      ) {
        const endBlock = Math.min(
          latestBlock,
          startBlock +
            rangeSize -
            1
        );

        for (const filter of filters) {
          const events =
            await marketplace.queryFilter(
              filter,
              startBlock,
              endBlock
            );

          for (const event of events) {
            const log =
              event as ethers.EventLog;

            const tokenId = Number(
              log.args.tokenId
            );

            let cardName =
              getCardName(tokenId);

            try {
              const card =
                await gameCard.getCard(
                  tokenId
                );

              cardName = card.name;
            } catch {}

            if (
              log.fragment.name ===
              "CardListed"
            ) {
              fallbackHistory.push({
                type: "LISTED",
                tokenId,
                cardName,
                price:
                  ethers.formatEther(
                    log.args.price
                  ),
                seller: String(
                  log.args.seller
                ),
                transactionHash:
                  log.transactionHash,
                blockNumber:
                  log.blockNumber,
              });
            } else if (
              log.fragment.name ===
              "CardSold"
            ) {
              fallbackHistory.push({
                type: "SOLD",
                tokenId,
                cardName,
                price:
                  ethers.formatEther(
                    log.args.price
                  ),
                seller: String(
                  log.args.seller
                ),
                buyer: String(
                  log.args.buyer
                ),
                transactionHash:
                  log.transactionHash,
                blockNumber:
                  log.blockNumber,
              });
            } else {
              fallbackHistory.push({
                type: "UNLISTED",
                tokenId,
                cardName,
                price: "0",
                seller: String(
                  log.args.seller
                ),
                transactionHash:
                  log.transactionHash,
                blockNumber:
                  log.blockNumber,
              });
            }
          }
        }
      }

      fallbackHistory.sort(
        (a, b) =>
          b.blockNumber -
          a.blockNumber
      );

      setActivities(
        fallbackHistory
      );

      console.info(
        `Loaded ${fallbackHistory.length} marketplace activities from RPC fallback.`
      );
    } catch (fallbackError) {
      console.error(
        "Activity fallback failed:",
        fallbackError
      );

      setActivities([]);
    }
  }

  /*
   * =====================================================
   * CONNECT WALLET
   * =====================================================
   */

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus(
          "Please install MetaMask."
        );
        return;
      }

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const accounts =
        await provider.send(
          "eth_requestAccounts",
          []
        );

      if (!accounts.length) {
        return;
      }

      const newAccount =
        accounts[0];

      setAccount(newAccount);
      setCards([]);

      setStatus(
        "Wallet connected successfully!"
      );

      await loadCards(
        newAccount
      );

      await loadActivity();
    } catch (error) {
      console.error(error);

      setStatus(
        "Failed to connect wallet."
      );
    }
  }

  /*
   * =====================================================
   * LOAD CARDS
   * =====================================================
   */

  async function loadCards(
    walletAddress: string
  ) {
    const currentRequest =
      ++loadRequestId.current;

    try {
      if (!window.ethereum) {
        return;
      }

      setLoadingCards(true);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const gameCard =
        new ethers.Contract(
          GAME_CARD_ADDRESS,
          GAME_CARD_ABI,
          provider
        );

      const marketplace =
        new ethers.Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          provider
        );

      const loadedCards: Card[] =
        [];

      for (const tokenId of CARD_IDS) {
        try {
          const owner =
            await gameCard.ownerOf(
              tokenId
            );

          const cardData =
            await gameCard.getCard(
              tokenId
            );

          const listing =
            await marketplace.listings(
              tokenId
            );

          const listed =
            listing.seller !==
            ethers.ZeroAddress;

          const imageCID =
            IMAGE_CIDS[tokenId];

          const image = imageCID
            ? ipfsUrl(
                imageCID,
                0
              )
            : "";

          loadedCards.push({
            tokenId,
            name: cardData.name,
            description:
              cardData.description,
            rarity: cardData.rarity,
            attack: Number(
              cardData.attack
            ),
            defense: Number(
              cardData.defense
            ),
            image,
            owner,
            listed,
            price: listed
              ? ethers.formatEther(
                  listing.price
                )
              : "0",
          });
        } catch (error) {
          console.log(
            `Token #${tokenId} could not be loaded.`,
            error
          );
        }
      }

      if (
        currentRequest !==
        loadRequestId.current
      ) {
        return;
      }

      setCards(
        loadedCards
      );

      setAccount(
        walletAddress
      );
    } catch (error) {
      console.error(error);

      if (
        currentRequest ===
        loadRequestId.current
      ) {
        setStatus(
          "Failed to load cards from the blockchain."
        );
      }
    } finally {
      if (
        currentRequest ===
        loadRequestId.current
      ) {
        setLoadingCards(false);
      }
    }
  }

  /*
   * =====================================================
   * BUY CARD
   * =====================================================
   */

  async function buyCard(
    tokenId: number
  ) {
    try {
      if (!window.ethereum) {
        setStatus(
          "Please install MetaMask."
        );
        return;
      }

      if (!account) {
        await connectWallet();
        return;
      }

      setLoading(true);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const marketplace =
        new ethers.Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          signer
        );

      const listing =
        await marketplace.listings(
          tokenId
        );

      if (
        listing.seller ===
        ethers.ZeroAddress
      ) {
        setStatus(
          "This card is not currently listed."
        );
        return;
      }

      const price =
        ethers.formatEther(
          listing.price
        );

      const balance =
        await provider.getBalance(
          account
        );

      if (
        balance < listing.price
      ) {
        setStatus(
          "Insufficient Sepolia ETH for this purchase."
        );
        return;
      }

      setStatus(
        `Buying ${getCardName(
          tokenId
        )} for ${price} ETH...`
      );

      const tx =
        await marketplace.buyCard(
          tokenId,
          {
            value:
              listing.price,
          }
        );

      setStatus(
        "Transaction submitted. Waiting for confirmation..."
      );

      await tx.wait();

      setStatus(
        `${getCardName(
          tokenId
        )} purchased successfully!`
      );

      setSelectedCard(null);

      await loadCards(
        account
      );

      await loadActivity();
    } catch (error: any) {
      console.error(error);

      if (
        error?.code === 4001 ||
        error?.code ===
          "ACTION_REJECTED"
      ) {
        setStatus(
          "Transaction rejected in MetaMask."
        );
      } else {
        setStatus(
          "Transaction failed. Check the browser console."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * SELL CARD
   * =====================================================
   */

  async function sellCard(
    tokenId: number
  ) {
    try {
      if (!window.ethereum) {
        setStatus(
          "Please install MetaMask."
        );
        return;
      }

      if (!account) {
        await connectWallet();
        return;
      }

      const priceInput =
        window.prompt(
          `Enter selling price for ${getCardName(
            tokenId
          )} in ETH:`
        );

      if (
        priceInput === null ||
        !priceInput.trim()
      ) {
        return;
      }

      let price: bigint;

      try {
        price =
          ethers.parseEther(
            priceInput.trim()
          );
      } catch {
        setStatus(
          "Invalid ETH price."
        );
        return;
      }

      if (price <= 0n) {
        setStatus(
          "Price must be greater than zero."
        );
        return;
      }

      setLoading(true);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const gameCard =
        new ethers.Contract(
          GAME_CARD_ADDRESS,
          GAME_CARD_ABI,
          signer
        );

      const marketplace =
        new ethers.Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          signer
        );

      setStatus(
        "Approving marketplace..."
      );

      const approval =
        await gameCard.approve(
          MARKETPLACE_ADDRESS,
          tokenId
        );

      await approval.wait();

      setStatus(
        "Listing card..."
      );

      const tx =
        await marketplace.listCard(
          tokenId,
          price
        );

      await tx.wait();

      setStatus(
        `${getCardName(
          tokenId
        )} listed successfully!`
      );

      setSelectedCard(null);

      await loadCards(
        account
      );

      await loadActivity();
    } catch (error: any) {
      console.error(error);

      if (
        error?.code === 4001 ||
        error?.code ===
          "ACTION_REJECTED"
      ) {
        setStatus(
          "Transaction rejected."
        );
      } else {
        setStatus(
          "Listing failed."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * UNLIST CARD
   * =====================================================
   */

  async function unlistCard(
    tokenId: number
  ) {
    try {
      if (!window.ethereum) {
        return;
      }

      setLoading(true);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const marketplace =
        new ethers.Contract(
          MARKETPLACE_ADDRESS,
          MARKETPLACE_ABI,
          signer
        );

      setStatus(
        "Cancelling listing..."
      );

      const tx =
        await marketplace.unlistCard(
          tokenId
        );

      await tx.wait();

      setStatus(
        "Listing cancelled."
      );

      setSelectedCard(null);

      await loadCards(
        account
      );

      await loadActivity();
    } catch (error) {
      console.error(error);

      setStatus(
        "Failed to cancel listing."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * TRANSFER CARD
   * =====================================================
   */

  async function transferCard(
    tokenId: number
  ) {
    try {
      if (!window.ethereum) {
        setStatus(
          "Please install MetaMask."
        );
        return;
      }

      if (!account) {
        setStatus(
          "Connect your wallet first."
        );
        return;
      }

      const recipient =
        recipientAddress.trim();

      if (!recipient) {
        setStatus(
          "Enter a recipient wallet address."
        );
        return;
      }

      if (
        !ethers.isAddress(
          recipient
        )
      ) {
        setStatus(
          "Invalid wallet address."
        );
        return;
      }

      if (
        recipient.toLowerCase() ===
        account.toLowerCase()
      ) {
        setStatus(
          "You cannot transfer to yourself."
        );
        return;
      }

      const card =
        cards.find(
          (item) =>
            item.tokenId ===
            tokenId
        );

      if (!card) {
        setStatus(
          "Card not found."
        );
        return;
      }

      if (
        card.owner.toLowerCase() !==
        account.toLowerCase()
      ) {
        setStatus(
          "Only the owner can transfer this card."
        );
        return;
      }

      if (card.listed) {
        setStatus(
          "Cancel the marketplace listing before transferring."
        );
        return;
      }

      setLoading(true);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const gameCard =
        new ethers.Contract(
          GAME_CARD_ADDRESS,
          GAME_CARD_ABI,
          signer
        );

      setStatus(
        `Transferring ${card.name}...`
      );

      const tx =
        await gameCard.transferFrom(
          account,
          recipient,
          tokenId
        );

      setStatus(
        "Transfer submitted. Waiting for confirmation..."
      );

      await tx.wait();

      setStatus(
        `${card.name} transferred to ${shortenAddress(
          recipient
        )}!`
      );

      setTransferCardId(null);
      setRecipientAddress("");
      setSelectedCard(null);

      await loadCards(
        account
      );

      await loadActivity();
    } catch (error: any) {
      console.error(error);

      if (
        error?.code === 4001 ||
        error?.code ===
          "ACTION_REJECTED"
      ) {
        setStatus(
          "Transfer rejected."
        );
      } else {
        setStatus(
          "Transfer failed."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * IMAGE FALLBACK
   * =====================================================
   */

  function imageError(
    event: SyntheticEvent<HTMLImageElement>,
    tokenId: number
  ) {
    const image =
      event.currentTarget;

    const current =
      Number(
        image.dataset.gateway ||
          "0"
      );

    const next =
      current + 1;

    if (
      next <
      IPFS_GATEWAYS.length
    ) {
      image.dataset.gateway =
        String(next);

      image.src = ipfsUrl(
        IMAGE_CIDS[tokenId],
        next
      );
    }
  }

  /*
   * =====================================================
   * INITIALIZE
   * =====================================================
   */

  useEffect(() => {
    async function initialize() {
      if (!window.ethereum) {
        return;
      }

      try {
        const provider =
          new ethers.BrowserProvider(
            window.ethereum
          );

        const accounts =
          await provider.send(
            "eth_accounts",
            []
          );

        await loadActivity();

        if (accounts.length) {
          setAccount(
            accounts[0]
          );

          await loadCards(
            accounts[0]
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    initialize();
  }, []);

  /*
   * =====================================================
   * ACCOUNT CHANGE
   * =====================================================
   */

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const handleAccountsChanged =
      (accounts: string[]) => {
        loadRequestId.current++;

        setCards([]);
        setSelectedCard(null);

        if (!accounts.length) {
          setAccount("");

          setStatus(
            "Wallet disconnected."
          );

          return;
        }

        setAccount(
          accounts[0]
        );

        setStatus(
          "Loading new wallet collection..."
        );

        loadCards(
          accounts[0]
        );

        loadActivity();
      };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  /*
   * =====================================================
   * FILTERS
   * =====================================================
   */

  function filterCards(
    input: Card[]
  ) {
    let result = [
      ...input,
    ];

    if (searchTerm.trim()) {
      const search =
        searchTerm
          .toLowerCase()
          .trim();

      result =
        result.filter(
          (card) =>
            card.name
              .toLowerCase()
              .includes(search) ||
            card.description
              .toLowerCase()
              .includes(search)
        );
    }

    if (
      rarityFilter !==
      "All"
    ) {
      result =
        result.filter(
          (card) =>
            card.rarity ===
            rarityFilter
        );
    }

    if (
      sortOption ===
      "price-low"
    ) {
      result.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );
    }

    if (
      sortOption ===
      "price-high"
    ) {
      result.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );
    }

    if (
      sortOption ===
      "attack-high"
    ) {
      result.sort(
        (a, b) =>
          b.attack -
          a.attack
      );
    }

    if (
      sortOption ===
      "defense-high"
    ) {
      result.sort(
        (a, b) =>
          b.defense -
          a.defense
      );
    }

    return result;
  }

  const ownedCards =
    cards.filter(
      (card) =>
        account &&
        card.owner.toLowerCase() ===
          account.toLowerCase()
    );

  const marketplaceCards =
    cards.filter(
      (card) =>
        card.listed
    );

  const visibleOwnedCards =
    filterCards(
      ownedCards
    );

  const visibleMarketplaceCards =
    filterCards(
      marketplaceCards
    );

  const totalCards =
    ownedCards.length;

  const commonCount =
    ownedCards.filter(
      (card) =>
        card.rarity ===
        "Common"
    ).length;

  const rareCount =
    ownedCards.filter(
      (card) =>
        card.rarity ===
        "Rare"
    ).length;

  const epicCount =
    ownedCards.filter(
      (card) =>
        card.rarity ===
        "Epic"
    ).length;

  const legendaryCount =
    ownedCards.filter(
      (card) =>
        card.rarity ===
        "Legendary"
    ).length;

  const mythicCount =
    ownedCards.filter(
      (card) =>
        card.rarity ===
        "Mythic"
    ).length;

  const totalAttack =
    ownedCards.reduce(
      (sum, card) =>
        sum + card.attack,
      0
    );

  const totalDefense =
    ownedCards.reduce(
      (sum, card) =>
        sum + card.defense,
      0
    );

  const averageAttack =
    totalCards > 0
      ? (
          totalAttack /
          totalCards
        ).toFixed(1)
      : "0";

  const averageDefense =
    totalCards > 0
      ? (
          totalDefense /
          totalCards
        ).toFixed(1)
      : "0";

  const cardStyle:
    CSSProperties = {
    width: "340px",
    overflow: "hidden",
    cursor: "pointer",
  };

  const gridStyle:
    CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 340px))",
    justifyContent: "center",
    gap: "28px",
    width: "100%",
  };

  return (
    <div className="app">

      <header>

        <div>
          <h1>
            MythicForge
          </h1>

          <p>
            Decentralized Game
            Card Marketplace
          </p>
        </div>

        <button
          onClick={
            connectWallet
          }
          disabled={loading}
        >
          {account
            ? `${account.slice(
                0,
                6
              )}...${account.slice(
                -4
              )}`
            : "Connect MetaMask"}
        </button>

      </header>

      <section className="hero">

        <h2>
          MythicForge
        </h2>

        <p>
          Collect, trade, and
          own blockchain game
          cards.
        </p>

        <p className="network">
          Ethereum Sepolia
          Testnet
        </p>

      </section>

      {status && (
        <div className="status">
          {status}
        </div>
      )}

      {/* MARKETPLACE */}

      <section className="card-section">

        <div
          style={{
            width: "100%",
            maxWidth:
              "1100px",
          }}
        >

          <div className="section-title">

            <h2>
              Marketplace
            </h2>

            <p>
              Game cards
              available for
              purchase
            </p>

          </div>

          <div
            className="filter-bar"
            style={{
              display:
                "flex",
              justifyContent:
                "center",
              gap: "10px",
              flexWrap:
                "wrap",
              marginBottom:
                "30px",
            }}
          >

            <input
              className="search-input"
              type="text"
              placeholder="🔎 Search cards..."
              value={
                searchTerm
              }
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

            <select
              value={
                rarityFilter
              }
              onChange={(event) =>
                setRarityFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Rarities
              </option>

              <option value="Common">
                Common
              </option>

              <option value="Rare">
                Rare
              </option>

              <option value="Epic">
                Epic
              </option>

              <option value="Legendary">
                Legendary
              </option>

              <option value="Mythic">
                Mythic
              </option>
            </select>

            <select
              value={
                sortOption
              }
              onChange={(event) =>
                setSortOption(
                  event.target.value
                )
              }
            >
              <option value="default">
                Sort By
              </option>

              <option value="price-low">
                Price: Low → High
              </option>

              <option value="price-high">
                Price: High → Low
              </option>

              <option value="attack-high">
                Attack: High → Low
              </option>

              <option value="defense-high">
                Defense: High → Low
              </option>
            </select>

            {(
              searchTerm ||
              rarityFilter !==
                "All" ||
              sortOption !==
                "default"
            ) && (
              <button
                onClick={() => {
                  setSearchTerm(
                    ""
                  );

                  setRarityFilter(
                    "All"
                  );

                  setSortOption(
                    "default"
                  );
                }}
              >
                Reset
              </button>
            )}

          </div>

          {loadingCards ? (
            <div className="status">
              Loading cards...
            </div>
          ) : (
            <div
              style={
                gridStyle
              }
            >

              {visibleMarketplaceCards.map(
                (card) => (
                  <div
                    key={
                      card.tokenId
                    }
                    className={`game-card ${rarityClass(
                      card.rarity
                    )}`}
                    style={
                      cardStyle
                    }
                    onClick={() =>
                      setSelectedCard(
                        card
                      )
                    }
                  >

                    <div
                      style={{
                        height:
                          "260px",
                        overflow:
                          "hidden",
                        position:
                          "relative",
                      }}
                    >

                      <img
                        src={
                          card.image
                        }
                        alt={
                          card.name
                        }
                        data-gateway="0"
                        onError={(
                          event
                        ) =>
                          imageError(
                            event,
                            card.tokenId
                          )
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "100%",
                          objectFit:
                            "cover",
                          display:
                            "block",
                        }}
                      />

                      <span className="token-id">
                        #
                        {
                          card.tokenId
                        }
                      </span>

                    </div>

                    <div
                      style={{
                        padding:
                          "20px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                        }}
                      >

                        <h2>
                          {
                            card.name
                          }
                        </h2>

                        <span
                          className={`rarity ${rarityClass(
                            card.rarity
                          )}`}
                        >
                          {
                            card.rarity
                          }
                        </span>

                      </div>

                      <p>
                        {
                          card.description
                        }
                      </p>

                      <div className="stats">

                        <span>
                          Attack:{" "}
                          {
                            card.attack
                          }
                        </span>

                        <span>
                          Defense:{" "}
                          {
                            card.defense
                          }
                        </span>

                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          marginTop:
                            "20px",
                        }}
                      >

                        <strong>
                          {
                            card.price
                          }{" "}
                          ETH
                        </strong>

                        <button
                          className="buy-button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            buyCard(
                              card.tokenId
                            );
                          }}
                          disabled={
                            loading
                          }
                        >
                          {loading
                            ? "Processing..."
                            : "Buy"}
                        </button>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

          {!loadingCards &&
            visibleMarketplaceCards.length ===
              0 && (
              <div className="status">
                No cards are
                currently listed
                on the
                marketplace.
              </div>
            )}

        </div>

      </section>

      {/* MY COLLECTION */}

      <section
        className="card-section"
        style={{
          paddingTop:
            "70px",
        }}
      >

        <div
          style={{
            width: "100%",
            maxWidth:
              "1100px",
          }}
        >

          <div className="section-title">

            <h2>
              My Collection
            </h2>

            <p>
              Your blockchain
              game cards
            </p>

          </div>

          {account && (
            <div
              style={{
                margin:
                  "25px auto 40px",
                padding:
                  "25px",
                background:
                  "#171720",
                border:
                  "1px solid #30303d",
                borderRadius:
                  "18px",
                maxWidth:
                  "1000px",
              }}
            >

              <h3
                style={{
                  textAlign:
                    "center",
                  marginTop:
                    0,
                  marginBottom:
                    "25px",
                }}
              >
                📊 Collection
                Statistics
              </h3>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(140px, 1fr))",
                  gap:
                    "14px",
                }}
              >

                <div className="collection-stat">

                  <span>
                    🃏
                  </span>

                  <strong>
                    {
                      totalCards
                    }
                  </strong>

                  <small>
                    Cards Owned
                  </small>

                </div>

                <div className="collection-stat">

                  <span>
                    ⚔️
                  </span>

                  <strong>
                    {
                      totalAttack
                    }
                  </strong>

                  <small>
                    Total Attack
                  </small>

                </div>

                <div className="collection-stat">

                  <span>
                    🛡️
                  </span>

                  <strong>
                    {
                      totalDefense
                    }
                  </strong>

                  <small>
                    Total Defense
                  </small>

                </div>

                <div className="collection-stat">

                  <span>
                    ⚔️
                  </span>

                  <strong>
                    {
                      averageAttack
                    }
                  </strong>

                  <small>
                    Avg Attack
                  </small>

                </div>

                <div className="collection-stat">

                  <span>
                    🛡️
                  </span>

                  <strong>
                    {
                      averageDefense
                    }
                  </strong>

                  <small>
                    Avg Defense
                  </small>

                </div>

              </div>

              <div
                style={{
                  marginTop:
                    "25px",
                  paddingTop:
                    "20px",
                  borderTop:
                    "1px solid #30303d",
                }}
              >

                <h4
                  style={{
                    textAlign:
                      "center",
                    marginBottom:
                      "15px",
                  }}
                >
                  Rarity
                  Breakdown
                </h4>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    gap:
                      "10px",
                    flexWrap:
                      "wrap",
                  }}
                >

                  <div className="rarity-count common">
                    Common:{" "}
                    {
                      commonCount
                    }
                  </div>

                  <div className="rarity-count rare">
                    Rare:{" "}
                    {
                      rareCount
                    }
                  </div>

                  <div className="rarity-count epic">
                    Epic:{" "}
                    {
                      epicCount
                    }
                  </div>

                  <div className="rarity-count legendary">
                    Legendary:{" "}
                    {
                      legendaryCount
                    }
                  </div>

                  <div className="rarity-count mythic">
                    Mythic:{" "}
                    {
                      mythicCount
                    }
                  </div>

                </div>

              </div>

            </div>
          )}

          {!account ? (
            <div className="status">
              Connect MetaMask
              to view your
              collection.
            </div>
          ) : visibleOwnedCards.length ===
            0 ? (
            <div className="status">
              No cards match
              your current
              filters.
            </div>
          ) : (
            <div
              style={
                gridStyle
              }
            >

              {visibleOwnedCards.map(
                (card) => (
                  <div
                    key={
                      card.tokenId
                    }
                    className={`game-card owned-card ${rarityClass(
                      card.rarity
                    )}`}
                    style={
                      cardStyle
                    }
                    onClick={() =>
                      setSelectedCard(
                        card
                      )
                    }
                  >

                    <div
                      style={{
                        height:
                          "260px",
                        overflow:
                          "hidden",
                        position:
                          "relative",
                      }}
                    >

                      <img
                        src={
                          card.image
                        }
                        alt={
                          card.name
                        }
                        data-gateway="0"
                        onError={(
                          event
                        ) =>
                          imageError(
                            event,
                            card.tokenId
                          )
                        }
                        style={{
                          width:
                            "100%",
                          height:
                            "100%",
                          objectFit:
                            "cover",
                          display:
                            "block",
                        }}
                      />

                      <span className="token-id">
                        #
                        {
                          card.tokenId
                        }
                      </span>

                    </div>

                    <div
                      style={{
                        padding:
                          "20px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                        }}
                      >

                        <h2>
                          {
                            card.name
                          }
                        </h2>

                        <span
                          className={`rarity ${rarityClass(
                            card.rarity
                          )}`}
                        >
                          {
                            card.rarity
                          }
                        </span>

                      </div>

                      <p>
                        {
                          card.description
                        }
                      </p>

                      <div className="stats">

                        <span>
                          Attack:{" "}
                          {
                            card.attack
                          }
                        </span>

                        <span>
                          Defense:{" "}
                          {
                            card.defense
                          }
                        </span>

                      </div>

                      <div
                        style={{
                          marginTop:
                            "20px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                          }}
                        >

                          <div
                            style={{
                              flex:
                                1,
                              padding:
                                "12px",
                              background:
                                "#242431",
                              borderRadius:
                                "8px",
                              textAlign:
                                "center",
                              fontSize:
                                "12px",
                              fontWeight:
                                "bold",
                            }}
                          >
                            OWNED BY YOU
                          </div>

                          <button
                            className="sell-button"
                            style={{
                              flex:
                                1,
                            }}
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              sellCard(
                                card.tokenId
                              );
                            }}
                            disabled={
                              loading
                            }
                          >
                            {loading
                              ? "..."
                              : "Sell"}
                          </button>

                        </div>

                        <button
                          className="transfer-button"
                          style={{
                            width:
                              "100%",
                            marginTop:
                              "8px",
                            padding:
                              "12px",
                            border:
                              "none",
                            borderRadius:
                              "8px",
                            background:
                              "#3b82f6",
                            color:
                              "white",
                            fontWeight:
                              "bold",
                            cursor:
                              "pointer",
                          }}
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            setTransferCardId(
                              card.tokenId
                            );

                            setRecipientAddress(
                              ""
                            );
                          }}
                          disabled={
                            loading ||
                            card.listed
                          }
                        >
                          {card.listed
                            ? "Cancel Listing First"
                            : "Transfer"}
                        </button>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </section>

      {/* RECENT ACTIVITY */}

      <section
        className="card-section"
        style={{
          paddingTop:
            "70px",
        }}
      >

        <div
          style={{
            width: "100%",
            maxWidth:
              "900px",
          }}
        >

          <div className="section-title">

            <h2>
              Recent Activity
            </h2>

            <p>
              Marketplace activity
            </p>

          </div>

          {activities.length ===
          0 ? (
            <div className="status">
              No marketplace
              activity yet.
            </div>
          ) : (
            <div>

              {activities
                .slice(0, 10)
                .map(
                  (
                    activity,
                    index
                  ) => (
                    <div
                      key={
                        activity.transactionHash +
                        index
                      }
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap:
                          "20px",
                        padding:
                          "18px",
                        marginBottom:
                          "10px",
                        background:
                          "#171720",
                        border:
                          "1px solid #30303d",
                        borderRadius:
                          "12px",
                      }}
                    >

                      <div>

                        <strong>
                          {activity.type ===
                          "LISTED"
                            ? "🏷️ Listed"
                            : activity.type ===
                              "SOLD"
                            ? "🛒 Sold"
                            : "↩️ Unlisted"}
                        </strong>

                        <p>
                          {
                            activity.cardName
                          }{" "}
                          #
                          {
                            activity.tokenId
                          }
                        </p>

                        {activity.type !==
                          "UNLISTED" && (
                          <p>
                            Price:{" "}
                            {
                              activity.price
                            }{" "}
                            ETH
                          </p>
                        )}

                      </div>

                      <a
                        href={`https://sepolia.etherscan.io/tx/${activity.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                        Transaction ↗
                      </a>

                    </div>
                  )
                )}

            </div>
          )}

        </div>

      </section>

      {/* ABOUT */}

      <section
        className="info-section"
        style={{
          maxWidth:
            "900px",
          margin:
            "60px auto",
        }}
      >

        <h2>
          About MythicForge
        </h2>

        <p>
          MythicForge is a
          decentralized
          game-card
          marketplace powered
          by Ethereum Sepolia.
          Each game card is an
          ERC-721 NFT with
          unique attributes
          and IPFS-based
          metadata.
        </p>

        <p>
          GameCard Contract:
        </p>

        <code>
          {
            GAME_CARD_ADDRESS
          }
        </code>

        <p>
          Marketplace Contract:
        </p>

        <code>
          {
            MARKETPLACE_ADDRESS
          }
        </code>

      </section>

      {/* CARD DETAILS MODAL */}

      {selectedCard && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedCard(
              null
            )
          }
        >

          <div
            className="card-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setSelectedCard(
                  null
                )
              }
            >
              ×
            </button>

            <div className="modal-image-container">

              <img
                src={
                  selectedCard.image
                }
                alt={
                  selectedCard.name
                }
                data-gateway="0"
                onError={(event) =>
                  imageError(
                    event,
                    selectedCard.tokenId
                  )
                }
              />

            </div>

            <div className="modal-content">

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >

                <div>

                  <h2>
                    {
                      selectedCard.name
                    }
                  </h2>

                  <span>
                    Token #
                    {
                      selectedCard.tokenId
                    }
                  </span>

                </div>

                <span
                  className={`rarity ${rarityClass(
                    selectedCard.rarity
                  )}`}
                >
                  {
                    selectedCard.rarity
                  }
                </span>

              </div>

              <p>
                {
                  selectedCard.description
                }
              </p>

              <div className="modal-stats">

                <div>

                  <span>
                    Attack
                  </span>

                  <strong>
                    {
                      selectedCard.attack
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    Defense
                  </span>

                  <strong>
                    {
                      selectedCard.defense
                    }
                  </strong>

                </div>

              </div>

              <div className="modal-owner">

                <span>
                  Current Owner
                </span>

                <code>
                  {
                    selectedCard.owner
                  }
                </code>

              </div>

              <div className="modal-status">

                <span>
                  Status
                </span>

                <strong>
                  {selectedCard.listed
                    ? "Listed on Marketplace"
                    : "Not Listed"}
                </strong>

              </div>

              {selectedCard.listed && (
                <div className="modal-price">

                  <span>
                    Current Price
                  </span>

                  <strong>
                    {
                      selectedCard.price
                    }{" "}
                    ETH
                  </strong>

                </div>
              )}

              <div className="card-history">

                <div className="card-history-header">

                  <h3>
                    Transaction
                    History
                  </h3>

                  <span>
                    {
                      getCardHistory(
                        selectedCard.tokenId
                      ).length
                    }{" "}
                    events
                  </span>

                </div>

                {getCardHistory(
                  selectedCard.tokenId
                ).length === 0 ? (
                  <div className="history-empty">
                    No marketplace
                    transactions yet.
                  </div>
                ) : (
                  <div className="history-list">

                    {getCardHistory(
                      selectedCard.tokenId
                    ).map(
                      (
                        activity,
                        index
                      ) => (
                        <div
                          className="history-item"
                          key={
                            activity.transactionHash +
                            index
                          }
                        >

                          <div className="history-icon">

                            {activity.type ===
                            "LISTED"
                              ? "🏷️"
                              : activity.type ===
                                "SOLD"
                              ? "🛒"
                              : "↩️"}

                          </div>

                          <div className="history-details">

                            <strong>
                              {activity.type ===
                              "LISTED"
                                ? "Listed"
                                : activity.type ===
                                  "SOLD"
                                ? "Sold"
                                : "Unlisted"}
                            </strong>

                            {activity.type !==
                              "UNLISTED" && (
                              <p>
                                Price:{" "}
                                {
                                  activity.price
                                }{" "}
                                ETH
                              </p>
                            )}

                            <p>
                              Seller:{" "}
                              {shortenAddress(
                                activity.seller
                              )}
                            </p>

                            {activity.buyer && (
                              <p>
                                Buyer:{" "}
                                {shortenAddress(
                                  activity.buyer
                                )}
                              </p>
                            )}

                            <a
                              href={`https://sepolia.etherscan.io/tx/${activity.transactionHash}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                              transaction
                              ↗
                            </a>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

              <div className="modal-actions">

                {selectedCard.listed &&
                  selectedCard.owner.toLowerCase() !==
                    account.toLowerCase() && (
                    <button
                      className="modal-buy-button"
                      onClick={() =>
                        buyCard(
                          selectedCard.tokenId
                        )
                      }
                      disabled={
                        loading
                      }
                    >
                      {loading
                        ? "Processing..."
                        : `Buy for ${selectedCard.price} ETH`}
                    </button>
                  )}

                {selectedCard.owner.toLowerCase() ===
                  account.toLowerCase() && (
                  <>

                    <div className="modal-owned">
                      OWNED BY YOU
                    </div>

                    {selectedCard.listed ? (
                      <button
                        className="modal-cancel-button"
                        onClick={() =>
                          unlistCard(
                            selectedCard.tokenId
                          )
                        }
                        disabled={
                          loading
                        }
                      >
                        {loading
                          ? "Processing..."
                          : "Cancel Listing"}
                      </button>
                    ) : (
                      <>

                        <button
                          className="modal-sell-button"
                          onClick={() =>
                            sellCard(
                              selectedCard.tokenId
                            )
                          }
                          disabled={
                            loading
                          }
                        >
                          {loading
                            ? "Processing..."
                            : "Sell Card"}
                        </button>

                        <button
                          className="modal-transfer-button"
                          onClick={() => {
                            setSelectedCard(
                              null
                            );

                            setTransferCardId(
                              selectedCard.tokenId
                            );

                            setRecipientAddress(
                              ""
                            );
                          }}
                          disabled={
                            loading
                          }
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
      )}

      {/* TRANSFER MODAL */}

      {transferCardId !==
        null && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!loading) {
              setTransferCardId(
                null
              );

              setRecipientAddress(
                ""
              );
            }
          }}
        >

          <div
            className="transfer-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() => {
                if (!loading) {
                  setTransferCardId(
                    null
                  );

                  setRecipientAddress(
                    ""
                  );
                }
              }}
            >
              ×
            </button>

            <h2>
              Transfer Card
            </h2>

            <p>
              Transfer{" "}
              <strong>
                {
                  getCardName(
                    transferCardId
                  )
                }
              </strong>{" "}
              #
              {
                transferCardId
              }{" "}
              to another wallet.
            </p>

            <label>
              Recipient Wallet
              Address
            </label>

            <input
              type="text"
              placeholder="0x..."
              value={
                recipientAddress
              }
              onChange={(event) =>
                setRecipientAddress(
                  event.target.value
                )
              }
              disabled={
                loading
              }
            />

            <p
              style={{
                fontSize:
                  "13px",
                opacity:
                  0.7,
              }}
            >
              This is a free NFT
              transfer. Only
              blockchain gas is
              required.
            </p>

            <div
              style={{
                display:
                  "flex",
                gap:
                  "10px",
                marginTop:
                  "20px",
              }}
            >

              <button
                onClick={() => {
                  if (!loading) {
                    setTransferCardId(
                      null
                    );

                    setRecipientAddress(
                      ""
                    );
                  }
                }}
                disabled={
                  loading
                }
              >
                Cancel
              </button>

              <button
                className="modal-transfer-button"
                onClick={() =>
                  transferCard(
                    transferCardId
                  )
                }
                disabled={
                  loading
                }
              >
                {loading
                  ? "Transferring..."
                  : "Transfer Card"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;