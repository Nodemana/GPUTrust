// src/App.js
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import { FaShoppingCart, FaPlusCircle, FaInfoCircle } from "react-icons/fa";
import { ethers } from "ethers";
import GPUListingJSON from "./contracts/GPUListing.json";

// --- Home page: Browse & Buy ---
function Home({ account, gpus, onDeposit }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      {/* Hero */}
      <section className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-lg shadow-md mb-12">
        <div>
          <h2 className="text-4xl font-extrabold mb-4">Discover &amp; Buy GPUs</h2>
          <p className="text-gray-600 mb-6">
            Secure, trustless GPU trading on the blockchain.
          </p>
          <Link
            to="/sell"
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg shadow inline-flex items-center"
            title="Go to Sell page to list your own GPU"
          >
            <FaPlusCircle className="mr-2" /> Sell Your GPU
          </Link>
        </div>
        <FaShoppingCart className="text-teal-600 text-9xl opacity-20 mt-6 md:mt-0" />
      </section>

      {/* Listings */}
      <section id="listings" className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6">Latest Listings</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gpus.map((gpu, idx) => {
            const valid = ethers.isAddress(gpu.uuid);
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded shadow flex flex-col justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">Address / UUID</p>
                  <h4 className="font-semibold mb-2">{gpu.uuid}</h4>
                  <p className="text-gray-600">
                    Price: {gpu.price} ETH{" "}
                    <FaInfoCircle
                      className="inline text-gray-400 hover:text-gray-600 ml-1"
                      title="Cost in Ether to purchase this GPU"
                    />
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() =>
                      valid && onDeposit(gpu.price, gpu.uuid)
                    }
                    disabled={!valid}
                    className={`py-2 px-4 rounded text-white ${valid
                      ? "bg-teal-500 hover:bg-teal-600"
                      : "bg-gray-300 cursor-not-allowed"
                      }`}
                    title={
                      valid
                        ? `Buy GPU at ${gpu.uuid} for ${gpu.price} ETH (stub)`
                        : "Invalid listing address"
                    }
                  >
                    Buy Now
                  </button>
                  {valid ? (
                    <Link
                      to={`/listing/${gpu.uuid}`}
                      className="text-teal-600 hover:underline ml-4"
                      title="View detailed listing page"
                    >
                      Details
                    </Link>
                  ) : (
                    <span
                      className="text-gray-400 ml-4 cursor-not-allowed"
                      title="Cannot view details for invalid address"
                    >
                      Details
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500">
        {account ? (
          <>Connected: <code title={account}>{account}</code></>
        ) : (
          "Not connected to MetaMask"
        )}
      </footer>
    </div>
  );
}

// --- Sell page: Sell Your GPU ---
function Sell({ onCreate }) {
  const [sellRegAddr, setSellRegAddr] = useState(
    "0xd9145CCE52D386f254917e481eB44e9943F39138"
  );
  const [sellPrice, setSellPrice] = useState("");
  const sellCommission = "1"; // fixed 1%

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <h2 className="text-3xl font-bold text-teal-700 mb-6">
        Sell Your GPU{" "}
        <FaInfoCircle
          className="inline text-gray-400 hover:text-gray-600 ml-2"
          title="Provide GPURegistration contract & price"
        />
      </h2>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="GPURegistration Address"
            value={sellRegAddr}
            onChange={(e) => setSellRegAddr(e.target.value)}
            className="border p-2 rounded"
            title="Your GPURegistration contract address"
          />
          <input
            placeholder="Price (ETH)"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            className="border p-2 rounded"
            title="Sale price in ETH (e.g. 1.5)"
          />
          <div
            className="flex items-center justify-center text-gray-600"
            title="Commission is fixed at 1%"
          >
            Commission: <span className="font-medium ml-2">1%</span>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={() =>
              onCreate({ sellRegAddr, sellPrice, sellCommission })
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            title="Simulate creating listing"
          >
            Create Listing
          </button>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link to="/" className="text-teal-600 hover:underline" title="Back to Browse">
          ← Back to Browse
        </Link>
      </div>
    </div>
  );
}

// --- Detailed Listing page: Approvals & Status ---
function ListingDetail() {
  const { address } = useParams();

  // Dummy data
  const seller = "0x1234…abcd";
  const arbiter = "0x5678…ef01";
  const buyer = "0x9abc…2345";
  const deposited = true;

  // keep track of which roles have voted
  const [releaseVotes, setReleaseVotes] = useState([]);
  const [refundVotes, setRefundVotes] = useState([]);
  const [currentUser] = useState("arbiter");
  const roles = { seller, arbiter, buyer };
  const canApprove = deposited && Object.values(roles).includes(roles[currentUser]);

  const handleApprove = (type) => {
    const alreadyApprovedRelease = releaseVotes.includes(currentUser);
    const alreadyApprovedRefund = refundVotes.includes(currentUser);

    if (type === "release") {
      if (alreadyApprovedRefund) {
        alert("⚠️ You've already approved a refund. Cannot approve release.");
        return;
      }
      if (alreadyApprovedRelease) {
        alert("⚠️ Already approved release.");
        return;
      }
      setReleaseVotes(prev => [...prev, currentUser]);
    }

    if (type === "refund") {
      if (alreadyApprovedRelease) {
        alert("⚠️ You've already approved a release. Cannot approve refund.");
        return;
      }
      if (alreadyApprovedRefund) {
        alert("⚠️ Already approved refund.");
        return;
      }
      setRefundVotes(prev => [...prev, currentUser]);
    }
  };

  const hasReleased = releaseVotes.length >= 2;
  const hasRefunded = refundVotes.length >= 2;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Listing Details
          </h2>

          <div className="space-y-3 text-gray-700">
            {[
              ["Contract:", address],
              ["Seller:", seller],
              ["Arbiter:", arbiter],
              ["Buyer:", buyer],
            ].map(([label, val]) => (
              <div className="flex" key={label}>
                <span className="w-32 font-medium">{label}</span>
                <span className="break-all">{val}</span>
              </div>
            ))}

            <div className="flex items-center">
              <span className="w-32 font-medium">Deposited:</span>
              <span
                className={`inline-block px-2 py-1 rounded-full text-sm font-semibold ${deposited ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
              >
                {deposited ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center">
              <span className="w-32 font-medium">Release Approvals:</span>
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {releaseVotes.length} {hasReleased && "✅ Released"}
              </span>
            </div>

            <div className="flex items-center">
              <span className="w-32 font-medium">Refund Approvals:</span>
              <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                {refundVotes.length} {hasRefunded && "💸 Refunded"}
              </span>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => handleApprove("release")}
              disabled={
                !deposited ||
                releaseVotes.includes(currentUser) ||
                refundVotes.includes(currentUser) ||
                hasReleased
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg disabled:opacity-50"
            >
              Approve Release
            </button>
            <button
              onClick={() => handleApprove("refund")}
              disabled={
                !deposited ||
                refundVotes.includes(currentUser) ||
                releaseVotes.includes(currentUser) ||
                hasRefunded
              }
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg disabled:opacity-50"
            >
              Approve Refund
            </button>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-100 text-center">
          <Link to="/" className="text-teal-600 hover:text-teal-700 font-medium">
            ← Back to Browse
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Main App with Router ---
export default function App() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [gpus, setGpus] = useState([
    { uuid: "0xa131AD247055FD2e2aA8b156A11bdEc81b9eAD95", price: "1.2" },
    { uuid: "0xd9145CCE52D386f254917e481eB44e9943F39138", price: "0.9" },
  ]);

  useEffect(() => {
    async function init() {
      if (!window.ethereum) return alert("Please install MetaMask");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const s = await provider.getSigner();
      setSigner(s);
      setAccount(await s.getAddress());
    }
    init();
  }, []);

  // Stub: simulate creating a listing
  const handleCreateListing = ({ sellRegAddr, sellPrice, sellCommission }) => {
    const fakeAddress = ethers.Wallet.createRandom().address;
    alert(
      `✨ (Stub) Created listing at ${fakeAddress}\n` +
      `Price: ${sellPrice} ETH\nCommission: ${sellCommission}%`
    );
    setGpus((prev) => [...prev, { uuid: fakeAddress, price: sellPrice }]);
  };

  // BUY: UI stub only
  const handleDeposit = (amount, listingAddr) => {
    alert(`✨ (Stub) Bought GPU at ${listingAddr} for ${amount} ETH`);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home account={account} gpus={gpus} onDeposit={handleDeposit} />
          }
        />
        <Route
          path="/sell"
          element={<Sell onCreate={handleCreateListing} />}
        />
        <Route path="/listing/:address" element={<ListingDetail />} />
      </Routes>
    </Router>
  );
}
