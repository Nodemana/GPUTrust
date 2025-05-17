// src/App.js
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  FaShoppingCart,
  FaPlusCircle,
  FaInfoCircle,
  FaSyncAlt,
} from "react-icons/fa";
import { ethers } from "ethers";
import GPUListingJSON from "./contracts/GPUListing.json";
import GPURegistrationJSON from "./contracts/GPURegistration.json";

// switch MetaMask to Sepolia
async function ensureSepolia() {
  if (!window.ethereum) {
    alert(" Please install MetaMask");
    return false;
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });
    return true;
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xaa36a7",
            chainName: "Sepolia Test Network",
            rpcUrls: ["https://rpc.sepolia.org"],
            nativeCurrency: { name: "SepoliaETH", symbol: "SEP", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
      return true;
    }
    console.error("Could not switch to Sepolia", err);
    return false;
  }
}

// Home: lists all listings and allows deposit
function Home({ account, gpus, handleDeposit, onSwitchSepolia }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <header className="flex justify-between items-center mb-8">
        <button
          onClick={onSwitchSepolia}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          <FaSyncAlt className="mr-2" /> Sepolia
        </button>
        <span className="text-gray-600">{account || "Not connected"}</span>
      </header>

      <section className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-lg shadow-md mb-12">
        <div>
          <h2 className="text-4xl font-extrabold mb-4">Discover &amp; Buy GPUs</h2>
          <p className="text-gray-600 mb-6">
            Secure, trustless GPU trading on the Sepolia testnet.
          </p>
          <Link
            to="/sell"
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg shadow inline-flex items-center"
          >
            <FaPlusCircle className="mr-2" /> Sell Your GPU
          </Link>
        </div>
        <FaShoppingCart className="text-teal-600 text-9xl opacity-20 mt-6 md:mt-0" />
      </section>

      <section id="listings" className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6">Latest Listings</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gpus.map(({ uuid, price }) => {
            const valid = ethers.isAddress(uuid);
            return (
              <div
                key={uuid}
                className="bg-white p-6 rounded shadow flex flex-col justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">Contract</p>
                  <h4 className="font-semibold mb-2 break-all">{uuid}</h4>
                  <p className="text-gray-600">
                    Price: {price} ETH{" "}
                    <FaInfoCircle
                      className="inline text-gray-400 hover:text-gray-600 ml-1"
                      title="Cost in Ether to purchase this GPU"
                    />
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => valid && handleDeposit(price, uuid)}
                    disabled={!valid}
                    className={`py-2 px-4 rounded text-white ${
                      valid ? "bg-teal-500 hover:bg-teal-600" : "bg-gray-300"
                    }`}
                  >
                    Buy Now
                  </button>
                  {valid ? (
                    <Link
                      to={`/listing/${uuid}`}
                      className="text-teal-600 hover:underline ml-4"
                    >
                      Details
                    </Link>
                  ) : (
                    <span className="text-gray-400 ml-4">Details</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// Sell: deploy both contracts, then navigate home
function Sell({ account, signer, onAddListing }) {
  const [uuid, setUuid] = useState("");
  const [benchmark, setBenchmark] = useState("");
  const [price, setPrice] = useState("");
  const commissionPerc = 1;
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!uuid || !benchmark || !price) {
      return alert("Fill out UUID, benchmark, and price.");
    }
    try {
      const regFactory = new ethers.ContractFactory(
        GPURegistrationJSON.abi,
        GPURegistrationJSON.bytecode,
        signer
      );
      const regHash = ethers.keccak256(ethers.toUtf8Bytes(benchmark));
      const regCtr = await regFactory.deploy(uuid, regHash);
      await regCtr.waitForDeployment();

      const listFactory = new ethers.ContractFactory(
        GPUListingJSON.abi,
        GPUListingJSON.bytecode,
        signer
      );
      const listingCtr = await listFactory.deploy(
        account,
        ethers.parseEther(price),
        commissionPerc,
        regCtr.target
      );
      await listingCtr.waitForDeployment();

      alert(
        `✅ Deployed!\nRegistration: ${regCtr.target}\nListing: ${listingCtr.target}`
      );
      onAddListing({ uuid: listingCtr.target, price });
      navigate("/");
    } catch (err) {
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        alert(" Transaction cancelled by user.");
      } else {
        console.error(err);
        alert(" Deployment failed: " + (err.message || err));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <h2 className="text-3xl font-bold text-teal-700 mb-6">Sell Your GPU</h2>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-4">
        <input
          placeholder="GPU UUID (e.g. GPU-1234)"
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          placeholder="Benchmark Data"
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          placeholder="Price (ETH)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <div className="text-gray-600">Commission: {commissionPerc}%</div>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Deploy Listing
        </button>
      </div>
      <div className="mt-8 text-center">
        <Link to="/" className="text-teal-600 hover:underline">
          ← Back to Browse
        </Link>
      </div>
    </div>
  );
}

// ListingDetail: fetch on-chain and allow approvals
function ListingDetail({ signer }) {
  const { address } = useParams();
  const [ctr, setCtr] = useState(null);
  const [info, setInfo] = useState({
    seller: "",
    arbiter: "",
    buyer: "",
    deposited: false,
    releaseCount: 0,
    refundCount: 0,
  });

  useEffect(() => {
    if (!signer) return;
    const c = new ethers.Contract(address, GPUListingJSON.abi, signer);
    setCtr(c);
    (async () => {
      const [s, a, b, d, r, f] = await Promise.all([
        c.seller(),
        c.arbiter(),
        c.buyer(),
        c.deposited(),
        c.release_ApprovalCount(),
        c.refund_ApprovalCount(),
      ]);
      setInfo({
        seller: s,
        arbiter: a,
        buyer: b,
        deposited: d,
        releaseCount: r,
        refundCount: f,
      });
    })();
  }, [signer, address]);

  const refresh = async () => {
    const d = await ctr.deposited();
    const r = await ctr.release_ApprovalCount();
    const f = await ctr.refund_ApprovalCount();
    setInfo((i) => ({ ...i, deposited: d, releaseCount: r, refundCount: f }));
  };

  const approve = async (fn) => {
    const tx = await ctr[fn]();
    await tx.wait();
    alert(`✅ ${fn} OK`);
    await refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-bold mb-4">Listing Details</h2>
          {[
            ["Contract", address],
            ["Seller", info.seller],
            ["Arbiter", info.arbiter],
            ["Buyer", info.buyer],
          ].map(([lab, val]) => (
            <div className="flex" key={lab}>
              <span className="w-32 font-medium">{lab}:</span>
              <span className="break-all">{val}</span>
            </div>
          ))}

          <div className="flex items-center mt-4">
            <span className="w-32 font-medium">Deposited:</span>
            <span
              className={`px-2 py-1 rounded-full text-sm font-semibold ${
                info.deposited ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {info.deposited ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <span className="w-32 font-medium">Release Approvals:</span>
            <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {info.releaseCount}
            </span>
          </div>
          <div className="flex items-center mt-2">
            <span className="w-32 font-medium">Refund Approvals:</span>
            <span className="px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              {info.refundCount}
            </span>
          </div>

          <div className="mt-6 space-x-4">
            <button
              onClick={() => approve("approveRelease")}
              disabled={!info.deposited}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Approve Release
            </button>
            <button
              onClick={() => approve("approveRefund")}
              disabled={!info.deposited}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Approve Refund
            </button>
          </div>
        </div>
        <div className="px-8 py-4 bg-gray-100 text-center">
          <Link to="/" className="text-teal-600 hover:underline">
            ← Back to Browse
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [gpus, setGpus] = useState([]);

  useEffect(() => {
    (async () => {
      if (!(await ensureSepolia())) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const s = await provider.getSigner();
      setSigner(s);
      setAccount(await s.getAddress());
    })();
  }, []);

  const addListing = ({ uuid, price }) => {
    setGpus((prev) => [...prev, { uuid, price }]);
  };

  const handleDeposit = async (amount, addr) => {
    try {
      const ctr = new ethers.Contract(addr, GPUListingJSON.abi, signer);
      const tx = await ctr.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      alert(`💰 Deposited ${amount} ETH`);
    } catch (err) {
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        alert(" Deposit cancelled by user.");
      } else {
        console.error(err);
        alert(" Deposit failed: " + (err.message || err));
      }
    }
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              account={account}
              gpus={gpus}
              handleDeposit={handleDeposit}
              onSwitchSepolia={ensureSepolia}
            />
          }
        />
        <Route
          path="/sell"
          element={<Sell account={account} signer={signer} onAddListing={addListing} />}
        />
        <Route path="/listing/:address" element={<ListingDetail signer={signer} />} />
      </Routes>
    </Router>
  );
}
