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
  "0x09003af707554132C3760F12De1856861890F2Ac";

const MARKETPLACE_ABI = [
  "function listings(uint256 tokenId) view returns (address seller, uint256 price)",
  "function buyCard(uint256 tokenId) payable",
  "function listCard(uint256 tokenId, uint256 price)",
  "function unlistCard(uint256 tokenId)",
  "event CardListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event CardSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event CardUnlisted(uint256 indexed tokenId, address indexed seller)",
];

const GAME_CARD_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getCard(uint256 tokenId) view returns (tuple(string name, string description, string rarity, uint256 attack, uint256 defense))",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function approve(address to, uint256 tokenId)",
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

const CARD_IDS = [1, 2, 3, 4, 5];

const IMAGE_CIDS: Record<number, string> = {
  1: "bafybeie5n5h7c3647uxedsvccpsjcxiopypco2m73wpycaim3ryogay32i",
  2: "bafybeibhlv3ufcjypbkkcokjou5r4xts6bfkbadjoup2r3o3ux44uqnezu",
  3: "bafybeihlpj72kwdp64pdulcfqnqtuzcisbxwoypv2t3abe4dt4ozq3jqp4",
  4: "bafybeiaxtvmovwtimgbwh6l44f7m3skmk3ppucoi2gixowrv2xprijpbj4",
  5: "bafybeifyzu43n22qhrkkkzocbskwgla54ql2b2s6hbjfr7bxcer6z7f6qa",
};

const METADATA_CIDS: Record<number, string> = {
  1: "bafkreiffufwq762mkfcyukfdifapghxxmdcmy2rt7ryxam2jbqv3jl6uxm",
  2: "bafkreid4sp6vmxhyyseozvnwrbzvozvgcfrpwgwtetmjuf35w4nur55d74",
  3: "bafkreibvexsi64bcv5lw5neqndaajgepqgtqa24dniw56qrgyv4ygsqfq4",
  4: "bafkreigviylsp7sycvyra6j37qii5vgucsemvxm4ytp6a7ztldcf6ztgrm",
  5: "bafkreigac3oipxpyae2g3vpc37otbcyad6ke3exmq35nwjjfqiinfj6lxe",
};

const IPFS_GATEWAYS = [
  "https://violet-labour-skink-360.mypinata.cloud/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

function getGatewayUrl(
  cid: string,
  gatewayIndex: number
) {
  return IPFS_GATEWAYS[gatewayIndex] + cid;
}

function App() {
  const [account, setAccount] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedCard, setSelectedCard] =
    useState<Card | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [rarityFilter, setRarityFilter] =
    useState("All");

  const [sortOption, setSortOption] =
    useState("default");

  const loadRequestId = useRef(0);

  function getCardName(tokenId: number): string {
    const card = cards.find(
      (item) => item.tokenId === tokenId
    );

    if (card) return card.name;

    const names: Record<number, string> = {
      1: "Flame Dragon",
      2: "Shadow Knight",
      3: "Storm Mage",
      4: "Crystal Golem",
      5: "Void Assassin",
    };

    return names[tokenId] || `Token #${tokenId}`;
  }

  function getRarityClass(rarity: string) {
    return `rarity-${rarity
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
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

  async function loadActivity() {
    try {
      if (!window.ethereum) return;

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

      const gameCard =
        new ethers.Contract(
          GAME_CARD_ADDRESS,
          GAME_CARD_ABI,
          provider
        );

      const activityList: Activity[] = [];

      const listedEvents =
        await marketplace.queryFilter(
          marketplace.filters.CardListed()
        );

      for (const event of listedEvents) {
        const log =
          event as ethers.EventLog;

        const tokenId = Number(
          log.args.tokenId
        );

        const seller = String(
          log.args.seller
        );

        const price =
          ethers.formatEther(
            log.args.price
          );

        let cardName =
          `Token #${tokenId}`;

        try {
          const card =
            await gameCard.getCard(
              tokenId
            );

          cardName = card.name;
        } catch {}

        activityList.push({
          type: "LISTED",
          tokenId,
          cardName,
          price,
          seller,
          transactionHash:
            log.transactionHash,
          blockNumber:
            log.blockNumber,
        });
      }

      const soldEvents =
        await marketplace.queryFilter(
          marketplace.filters.CardSold()
        );

      for (const event of soldEvents) {
        const log =
          event as ethers.EventLog;

        const tokenId = Number(
          log.args.tokenId
        );

        const seller = String(
          log.args.seller
        );

        const buyer = String(
          log.args.buyer
        );

        const price =
          ethers.formatEther(
            log.args.price
          );

        let cardName =
          `Token #${tokenId}`;

        try {
          const card =
            await gameCard.getCard(
              tokenId
            );

          cardName = card.name;
        } catch {}

        activityList.push({
          type: "SOLD",
          tokenId,
          cardName,
          price,
          seller,
          buyer,
          transactionHash:
            log.transactionHash,
          blockNumber:
            log.blockNumber,
        });
      }

      const unlistedEvents =
        await marketplace.queryFilter(
          marketplace.filters.CardUnlisted()
        );

      for (const event of unlistedEvents) {
        const log =
          event as ethers.EventLog;

        const tokenId = Number(
          log.args.tokenId
        );

        const seller = String(
          log.args.seller
        );

        let cardName =
          `Token #${tokenId}`;

        try {
          const card =
            await gameCard.getCard(
              tokenId
            );

          cardName = card.name;
        } catch {}

        activityList.push({
          type: "UNLISTED",
          tokenId,
          cardName,
          price: "0",
          seller,
          transactionHash:
            log.transactionHash,
          blockNumber:
            log.blockNumber,
        });
      }

      activityList.sort(
        (a, b) =>
          b.blockNumber -
          a.blockNumber
      );

      setActivities(activityList);
    } catch (error) {
      console.error(
        "Failed to load transaction history:",
        error
      );
    }
  }

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

      if (accounts.length === 0) {
        setStatus(
          "No wallet account found."
        );
        return;
      }

      const newAccount =
        accounts[0];

      setAccount(newAccount);
      setCards([]);

      setStatus(
        "Wallet connected successfully!"
      );

      await loadCards(newAccount);
      await loadActivity();
    } catch (error) {
      console.error(error);

      setStatus(
        "Failed to connect wallet."
      );
    }
  }

  async function loadCards(
    walletAddress: string
  ) {
    const requestId =
      ++loadRequestId.current;

    try {
      if (!window.ethereum) return;

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

      const loadedCards: Card[] = [];

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
            ? getGatewayUrl(
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
        requestId !==
        loadRequestId.current
      ) {
        return;
      }

      setCards(loadedCards);
      setAccount(walletAddress);
    } catch (error) {
      console.error(error);

      if (
        requestId ===
        loadRequestId.current
      ) {
        setStatus(
          "Failed to load cards from the blockchain."
        );
      }
    } finally {
      if (
        requestId ===
        loadRequestId.current
      ) {
        setLoadingCards(false);
      }
    }
  }

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

      if (balance < listing.price) {
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
            value: listing.price,
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

      await loadCards(account);
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

      if (priceInput === null) {
        return;
      }

      const trimmedPrice =
        priceInput.trim();

      if (!trimmedPrice) {
        setStatus(
          "Please enter a price."
        );
        return;
      }

      let price: bigint;

      try {
        price =
          ethers.parseEther(
            trimmedPrice
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
        `Approving ${getCardName(
          tokenId
        )} for the marketplace...`
      );

      const approvalTx =
        await gameCard.approve(
          MARKETPLACE_ADDRESS,
          tokenId
        );

      await approvalTx.wait();

      setStatus(
        `Approval complete. Listing ${getCardName(
          tokenId
        )}...`
      );

      const listingTx =
        await marketplace.listCard(
          tokenId,
          price
        );

      setStatus(
        "Listing transaction submitted. Waiting for confirmation..."
      );

      await listingTx.wait();

      setStatus(
        `${getCardName(
          tokenId
        )} listed successfully for ${trimmedPrice} ETH!`
      );

      setSelectedCard(null);

      await loadCards(account);
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
          "Failed to list the card."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function unlistCard(
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

      setStatus(
        `Removing ${getCardName(
          tokenId
        )} from the marketplace...`
      );

      const tx =
        await marketplace.unlistCard(
          tokenId
        );

      await tx.wait();

      setStatus(
        `${getCardName(
          tokenId
        )} removed from the marketplace.`
      );

      setSelectedCard(null);

      await loadCards(account);
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
          "Failed to remove the card from the marketplace."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleImageError(
    event: SyntheticEvent<
      HTMLImageElement
    >,
    tokenId: number
  ) {
    const image =
      event.currentTarget;

    const currentGateway =
      Number(
        image.dataset.gateway ||
          "0"
      );

    const nextGateway =
      currentGateway + 1;

    if (
      nextGateway <
      IPFS_GATEWAYS.length
    ) {
      image.dataset.gateway =
        String(nextGateway);

      image.src =
        getGatewayUrl(
          IMAGE_CIDS[tokenId],
          nextGateway
        );
    }
  }

  useEffect(() => {
    async function initialize() {
      if (!window.ethereum) return;

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

        if (accounts.length > 0) {
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

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged =
      (accounts: string[]) => {
        loadRequestId.current++;

        setCards([]);
        setSelectedCard(null);

        if (accounts.length === 0) {
          setAccount("");

          setStatus(
            "Wallet disconnected."
          );

          return;
        }

        const newAccount =
          accounts[0];

        setAccount(
          newAccount
        );

        setStatus(
          "Loading collection for the new wallet..."
        );

        loadCards(
          newAccount
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

  function filterAndSortCards(
    cardList: Card[]
  ) {
    let result = [...cardList];

    if (searchTerm.trim()) {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      result = result.filter(
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

    switch (sortOption) {
      case "price-low":
        result.sort(
          (a, b) =>
            Number(a.price) -
            Number(b.price)
        );
        break;

      case "price-high":
        result.sort(
          (a, b) =>
            Number(b.price) -
            Number(a.price)
        );
        break;

      case "attack-high":
        result.sort(
          (a, b) =>
            b.attack -
            a.attack
        );
        break;

      case "defense-high":
        result.sort(
          (a, b) =>
            b.defense -
            a.defense
        );
        break;

      default:
        break;
    }

    return result;
  }

  function resetFilters() {
    setSearchTerm("");
    setRarityFilter("All");
    setSortOption("default");
  }

  const marketplaceCards =
    filterAndSortCards(
      cards.filter(
        (card) =>
          card.listed
      )
    );

  const ownedCards =
    filterAndSortCards(
      cards.filter(
        (card) =>
          account &&
          card.owner.toLowerCase() ===
            account.toLowerCase()
      )
    );

  const cardStyle: CSSProperties = {
    width: "340px",
    minHeight: "520px",
    overflow: "hidden",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
  };

  const imageContainerStyle: CSSProperties =
    {
      width: "100%",
      height: "260px",
      minHeight: "260px",
      overflow: "hidden",
      position: "relative",
      borderRadius:
        "14px 14px 0 0",
    };

  const imageStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    objectPosition: "center",
  };

  const informationStyle: CSSProperties =
    {
      padding: "22px",
      minHeight: "240px",
      display: "flex",
      flexDirection: "column",
      justifyContent:
        "space-between",
    };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(340px, 340px))",
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

          <p className="header-subtitle">
            Decentralized Game Card
            Marketplace
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

      <main>

        <section className="hero">

          <h2>
            MythicForge
          </h2>

          <p>
            Collect, trade, and own
            blockchain game cards.
          </p>

          <p className="network">
            Ethereum Sepolia Testnet
          </p>

        </section>

        {status && (
          <div className="status">
            {status}
          </div>
        )}

        {/* MARKETPLACE */}

        <section className="marketplace-section">

          <div className="section-title">

            <div>
              <h2>
                Marketplace
              </h2>

              <p>
                Game cards currently
                available for purchase
              </p>
            </div>

          </div>

          <div className="filter-bar">

            <input
              type="text"
              className="search-input"
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

            {(searchTerm ||
              rarityFilter !==
                "All" ||
              sortOption !==
                "default") && (

              <button
                className="reset-button"
                onClick={
                  resetFilters
                }
              >
                Reset
              </button>

            )}

          </div>

          {loadingCards ? (

            <div className="loading">
              Loading cards from
              blockchain...
            </div>

          ) : marketplaceCards.length ===
            0 ? (

            <div className="empty-state">
              No cards match your
              search or filter.
            </div>

          ) : (

            <div
              className="cards-grid"
              style={gridStyle}
            >

              {marketplaceCards.map(
                (card) => (

                  <div
                    className={`game-card ${getRarityClass(
                      card.rarity
                    )}`}
                    key={
                      card.tokenId
                    }
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
                      className="card-image"
                      style={
                        imageContainerStyle
                      }
                    >

                      <img
                        src={
                          card.image
                        }
                        alt={
                          card.name
                        }
                        data-gateway="0"
                        style={
                          imageStyle
                        }
                        onError={(
                          event
                        ) =>
                          handleImageError(
                            event,
                            card.tokenId
                          )
                        }
                      />

                      <span className="token-id">
                        #
                        {
                          card.tokenId
                        }
                      </span>

                    </div>

                    <div
                      className="card-content"
                      style={
                        informationStyle
                      }
                    >

                      <div>

                        <div className="card-heading">

                          <h3>
                            {
                              card.name
                            }
                          </h3>

                          <span
                            className={`rarity ${getRarityClass(
                              card.rarity
                            )}`}
                          >
                            {
                              card.rarity
                            }
                          </span>

                        </div>

                        <p className="description">
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

                      </div>

                      <div className="price-row">

                        <div>

                          <small>
                            Price
                          </small>

                          <strong>
                            {
                              card.price
                            }{" "}
                            ETH
                          </strong>

                        </div>

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

        </section>

        {/* MY COLLECTION */}

        <section className="collection-section">

          <div className="section-title">

            <div>

              <h2>
                My Collection
              </h2>

              <p>
                Game cards owned by
                your connected wallet
              </p>

            </div>

          </div>

          {!account ? (

            <div className="empty-state">
              Connect MetaMask to
              view your collection.
            </div>

          ) : ownedCards.length ===
            0 ? (

            <div className="empty-state">
              No cards match your
              search or filter.
            </div>

          ) : (

            <div
              className="cards-grid"
              style={gridStyle}
            >

              {ownedCards.map(
                (card) => (

                  <div
                    className={`game-card owned-card ${getRarityClass(
                      card.rarity
                    )}`}
                    key={
                      card.tokenId
                    }
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
                      className="card-image"
                      style={
                        imageContainerStyle
                      }
                    >

                      <img
                        src={
                          card.image
                        }
                        alt={
                          card.name
                        }
                        data-gateway="0"
                        style={
                          imageStyle
                        }
                        onError={(
                          event
                        ) =>
                          handleImageError(
                            event,
                            card.tokenId
                          )
                        }
                      />

                      <span className="token-id">
                        #
                        {
                          card.tokenId
                        }
                      </span>

                    </div>

                    <div
                      className="card-content"
                      style={
                        informationStyle
                      }
                    >

                      <div>

                        <div className="card-heading">

                          <h3>
                            {
                              card.name
                            }
                          </h3>

                          <span
                            className={`rarity ${getRarityClass(
                              card.rarity
                            )}`}
                          >
                            {
                              card.rarity
                            }
                          </span>

                        </div>

                        <p className="description">
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

                      </div>

                      <div className="owned-actions">

                        <div className="owned-label">
                          OWNED BY YOU
                        </div>

                        <button
                          className="sell-button"
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
                            ? "Processing..."
                            : "Sell"}
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* RECENT ACTIVITY */}

        <section className="activity-section">

          <div className="section-title">

            <div>

              <h2>
                Recent Activity
              </h2>

              <p>
                Marketplace activity
                recorded on Ethereum
                Sepolia
              </p>

            </div>

          </div>

          {activities.length ===
          0 ? (

            <div className="empty-state">
              No marketplace activity
              found.
            </div>

          ) : (

            <div className="activity-list">

              {activities
                .slice(0, 10)
                .map(
                  (
                    activity,
                    index
                  ) => (

                    <div
                      className="activity-item"
                      key={
                        activity.transactionHash +
                        index
                      }
                    >

                      <div className="activity-main">

                        <div className="activity-type">
                          {
                            activity.type
                          }
                        </div>

                        <div>

                          <h3>
                            {
                              activity.cardName
                            }{" "}
                            #
                            {
                              activity.tokenId
                            }
                          </h3>

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
                            {
                              activity.seller.slice(
                                0,
                                6
                              )
                            }
                            ...
                            {
                              activity.seller.slice(
                                -4
                              )
                            }
                          </p>

                          {activity.buyer && (
                            <p>
                              Buyer:{" "}
                              {
                                activity.buyer.slice(
                                  0,
                                  6
                                )
                              }
                              ...
                              {
                                activity.buyer.slice(
                                  -4
                                )
                              }
                            </p>
                          )}

                        </div>

                      </div>

                      <a
                        href={`https://sepolia.etherscan.io/tx/${activity.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="transaction-link"
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      >
                        View Transaction
                      </a>

                    </div>

                  )
                )}

            </div>

          )}

        </section>

        {/* ABOUT */}

        <section className="info-section">

          <h2>
            About MythicForge
          </h2>

          <p>
            MythicForge is a
            decentralized game-card
            marketplace powered by
            Ethereum Sepolia. Each
            game card is an ERC-721 NFT
            with unique attributes and
            IPFS-based metadata.
          </p>

          <div className="contract-info">

            <div>

              <span>
                GameCard Contract
              </span>

              <code>
                {
                  GAME_CARD_ADDRESS
                }
              </code>

            </div>

            <div>

              <span>
                Marketplace Contract
              </span>

              <code>
                {
                  MARKETPLACE_ADDRESS
                }
              </code>

            </div>

          </div>

          <div className="ipfs-info">

            <h3>
              IPFS Metadata
            </h3>

            <p>
              Each game card stores
              its metadata and image
              using IPFS.
            </p>

            <a
              href={getGatewayUrl(
                METADATA_CIDS[1],
                0
              )}
              target="_blank"
              rel="noreferrer"
            >
              View Flame Dragon
              metadata
            </a>

          </div>

        </section>

      </main>

      {/* CARD DETAILS MODAL */}

      {selectedCard && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedCard(null)
          }
        >

          <div
            className={`card-modal ${getRarityClass(
              selectedCard.rarity
            )}`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setSelectedCard(null)
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
                  handleImageError(
                    event,
                    selectedCard.tokenId
                  )
                }
              />

            </div>

            <div className="modal-content">

              <div className="modal-title-row">

                <div>

                  <h2>
                    {
                      selectedCard.name
                    }
                  </h2>

                  <span className="modal-token">
                    Token #
                    {
                      selectedCard.tokenId
                    }
                  </span>

                </div>

                <span
                  className={`rarity ${getRarityClass(
                    selectedCard.rarity
                  )}`}
                >
                  {
                    selectedCard.rarity
                  }
                </span>

              </div>

              <p className="modal-description">
                {
                  selectedCard.description
                }
              </p>

              <div className="modal-stats">

                <div className="modal-stat">

                  <span>
                    Attack
                  </span>

                  <strong>
                    {
                      selectedCard.attack
                    }
                  </strong>

                </div>

                <div className="modal-stat">

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

              {/* TRANSACTION HISTORY */}

              <div className="card-history">

                <div className="card-history-header">
                  <h3>Transaction History</h3>
                  <span>
                    {getCardHistory(selectedCard.tokenId).length}{" "}
                    event{getCardHistory(selectedCard.tokenId).length === 1 ? "" : "s"}
                  </span>
                </div>

                {getCardHistory(selectedCard.tokenId).length === 0 ? (
                  <div className="history-empty">
                    No marketplace transactions recorded for this card yet.
                  </div>
                ) : (
                  <div className="history-list">
                    {getCardHistory(selectedCard.tokenId).map((activity, index) => (
                      <div
                        className={`history-item history-${activity.type.toLowerCase()}`}
                        key={activity.transactionHash + "-history-" + index}
                      >
                        <div className="history-icon">
                          {activity.type === "LISTED"
                            ? "🏷️"
                            : activity.type === "SOLD"
                            ? "🛒"
                            : "↩️"}
                        </div>

                        <div className="history-details">
                          <div className="history-top">
                            <strong>
                              {activity.type === "LISTED"
                                ? "Listed"
                                : activity.type === "SOLD"
                                ? "Sold"
                                : "Unlisted"}
                            </strong>

                            {activity.type !== "UNLISTED" && (
                              <span>{activity.price} ETH</span>
                            )}
                          </div>

                          <p>
                            Seller: {shortenAddress(activity.seller)}
                          </p>

                          {activity.buyer && (
                            <p>
                              Buyer: {shortenAddress(activity.buyer)}
                            </p>
                          )}

                          <a
                            href={`https://sepolia.etherscan.io/tx/${activity.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View transaction ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

                    )}

                  </>

                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;