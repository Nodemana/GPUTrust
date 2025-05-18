// src/App.js
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  FaShoppingCart,
  FaPlusCircle,
  FaInfoCircle,
  FaSyncAlt,
  FaClipboardList,
} from "react-icons/fa";
import { PiGraphicsCardFill } from "react-icons/pi";
import { ethers } from "ethers";
import GPUListingJSON from "./contracts/GPUListing.json";
import GPURegistrationJSON from "./contracts/GPURegistration.json";
import getBenchmark from "./utils.js";
import { useState, useRef, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  Autocomplete,
} from "@react-google-maps/api";
import PropTypes from "prop-types";
import { FaGavel } from "react-icons/fa";
const ARBITER_ADDRESS = ''
// --- switch MetaMask to Sepolia ---
async function ensureSepolia() {
  if (!window.ethereum) {
    alert("🦊 Please install MetaMask");
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
            nativeCurrency: {
              name: "SepoliaETH",
              symbol: "SEP",
              decimals: 18,
            },
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

// --- Home page ---
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
          <div className="flex flex-wrap gap-4">
            <Link
              to="/mygpus"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded shadow inline-flex items-center"
            >
              <PiGraphicsCardFill className="mr-2" /> My GPUs
            </Link>
            <Link
              to="/arbitration"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded shadow inline-flex items-center"
            >
              <FaGavel className="mr-2" /> Arbitration
            </Link>
            <Link
              to="/register"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded shadow inline-flex items-center"
            >
              <FaClipboardList className="mr-2" /> Register Your GPU
            </Link>
            <Link
              to="/sell"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded shadow inline-flex items-center"
            >
              <FaPlusCircle className="mr-2" /> Sell Your GPU
            </Link>
          </div>
        </div>
        <FaShoppingCart className="text-teal-600 text-9xl opacity-20 mt-8 md:mt-0" />
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
                    className={`py-2 px-4 rounded text-white ${valid ? "bg-teal-500 hover:bg-teal-600" : "bg-gray-300"
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
function ArbiterDashboard({ signer, listedGpus, raisedDisputes, account }) {
  const [onChainDisputes, setOnChainDisputes] = useState([]);

  useEffect(() => {
    if (!signer) return;
    (async () => {
      const out = [];
      for (let { uuid: address } of listedGpus) {
        const ctr = new ethers.Contract(address, GPUListingJSON.abi, signer);
        const arb = await ctr.arbiter();
        const deposited = await ctr.deposited();
        if (
          arb.toLowerCase() === ARBITER_ADDRESS.toLowerCase() &&
          deposited
        ) {
          const r = await ctr.release_ApprovalCount();
          const f = await ctr.refund_ApprovalCount();
          if (r > 0 && f > 0) out.push(address);
        }
      }
      setOnChainDisputes(out);
    })();
  }, [signer, listedGpus]);

  const allDisputes = Array.from(
    new Set([...onChainDisputes, ...raisedDisputes])
  );

  const handleApprove = async (address, method) => {
    try {
      const ctr = new ethers.Contract(address, GPUListingJSON.abi, signer);
      const tx = await ctr[method]();
      await tx.wait();
      alert(`✅ ${method} succeeded on ${address}`);
    } catch (err) {
      console.error(err);
      alert(`❌ ${method} failed: ${err.message || err}`);
    }
  };

  if (account?.toLowerCase() !== ARBITER_ADDRESS.toLowerCase()) {
    return (
      <div className="p-8 text-center text-red-600">
        Access denied: not the arbiter.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <h2 className="text-3xl font-bold mb-6">Arbitration Dashboard</h2>
      {allDisputes.length === 0 ? (
        <p className="text-gray-600">No active disputes.</p>
      ) : (
        <div className="space-y-4">
          {allDisputes.map((addr) => (
            <div
              key={addr}
              className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0"
            >
              <span className="break-all font-mono">{addr}</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleApprove(addr, "approveRelease")}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Approve Release
                </button>
                <button
                  onClick={() => handleApprove(addr, "approveRefund")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Approve Refund
                </button>
                <button
                  onClick={() =>
                    alert("📄 Stakeholders Dispute Policy sent (stub).")
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded inline-flex items-center"
                >
                  <FaGavel className="mr-2" />
                  Send Dispute Policy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8">
        <Link to="/" className="text-teal-600 hover:underline">
          ← Back to Browse
        </Link>
      </div>
    </div>
  );
}
// --- Benchmark & GPU Cards ---
function BenchmarkCard({ data, uuid }) {
  return (
    <div className="mt-8 bg-slate-300/70 backdrop-blur rounded-2xl shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between mb-6">
        <span className="text-xs font-mono text-gray-600 select-all">
          {uuid}
        </span>
        <span className="text-sm uppercase text-gray-500">
          Benchmark Results
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-4">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <dt className="text-[0.65rem] uppercase text-gray-500">
              {k.replace(/_/g, " ")}
            </dt>
            <dd className="text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function GPUCard({ gpu }) {
  const { uuid, benchmark = {}, reg_contract, benchmark_hash } = gpu;
  return (
    <div className="mt-8 bg-slate-300/70 backdrop-blur rounded-2xl shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between mb-6">
        <span className="text-xs font-mono text-gray-600 select-all">
          {uuid}
        </span>
        <span className="text-sm uppercase text-gray-500">
          Benchmark Results
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(benchmark).map(([k, v]) => (
          <div key={k}>
            <dt className="text-[0.65rem] uppercase text-gray-500">
              {k.replace(/_/g, " ")}
            </dt>
            <dd className="text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="text-xs text-gray-500 font-mono space-y-1 break-all">
        <p>
          <span className="uppercase text-[0.6rem]">Contract:</span>{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${reg_contract}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            {reg_contract}
          </a>
        </p>
        <p>
          <span className="uppercase text-[0.6rem]">Hash:</span>{" "}
          {benchmark_hash}
        </p>
      </div>
    </div>
  );
}

// --- Register GPU page ---
function RegisterGPU({ account, signer, onAddRegistration }) {
  const [uuid, setUuid] = useState("");
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateBenchmark = async () => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 3000));
    const data = getBenchmark();
    setBenchmark(data);
    setUuid(`GPU-${Math.floor(Math.random() * 100000)}`);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!uuid || !benchmark) {
      return alert("Run benchmark first!");
    }
    try {
      const factory = new ethers.ContractFactory(
        GPURegistrationJSON.abi,
        GPURegistrationJSON.bytecode,
        signer
      );
      const hash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(benchmark))
      );
      const ctr = await factory.deploy(uuid, hash);
      await ctr.waitForDeployment();
      alert(`✅ Deployed!\nRegistration: ${ctr.target}`);
      onAddRegistration({
        reg_contract: ctr.target,
        benchmark_hash: hash,
        uuid,
        benchmark,
      });
      navigate("/mygpus");
    } catch (err) {
      if (err.code === 4001) {
        alert("Transaction cancelled");
      } else {
        console.error(err);
        alert("Failed: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <h2 className="text-3xl font-bold text-teal-700 mb-6">
        Register Your GPU
      </h2>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-4">
        {loading && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-2">Crunching data…</p>
          </div>
        )}
        {!loading && benchmark && (
          <BenchmarkCard data={benchmark} uuid={uuid} />
        )}
        <button
          onClick={generateBenchmark}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Run Benchmark
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Register GPU
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

// --- My GPUs page: list registrations & allow “List for Sale” ---
function MyGPUs({ account, signer, mygpus }) {
  const navigate = useNavigate();

  if (!mygpus.length) {
    return (
      <div className="mt-16 text-center text-gray-500">
        <p className="text-lg">No GPUs registered.</p>
        <p className="text-sm">Use “Register Your GPU” above.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <h2 className="text-3xl font-bold text-teal-700 mb-6">My GPUs</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mygpus.map((gpu) => (
          <div key={gpu.uuid} className="relative">
            <GPUCard gpu={gpu} />
            <button
              onClick={() =>
                navigate(
                  `/sell?reg=${gpu.reg_contract}&uuid=${gpu.uuid}`
                )
              }
              className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
            >
              List for Sale
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/" className="text-teal-600 hover:underline">
          ← Back to Browse
        </Link>
      </div>
    </div>
  );
}

// --- Sell page: pre-fill & skip registration if params present ---
function Sell({ account, signer, onAddListing }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const presetReg = params.get("reg");
  const presetUuid = params.get("uuid");

  const [uuid, setUuid] = useState(presetUuid || "");
  const [price, setPrice] = useState("");
  const commissionPerc = 1;
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!uuid || !price || !presetReg) {
      return alert("UUID, registration address & price are required.");
    }
    try {
      const factory = new ethers.ContractFactory(
        GPUListingJSON.abi,
        GPUListingJSON.bytecode,
        signer
      );
      const ctr = await factory.deploy(
        account,
        ethers.parseEther(price),
        commissionPerc,
        presetReg
      );
      await ctr.waitForDeployment();
      alert(`✅ Listing deployed at ${ctr.target}`);
      onAddListing({ uuid: ctr.target, price });
      navigate("/");
    } catch (err) {
      if (err.code === 4001) {
        alert("Transaction cancelled");
      } else {
        console.error(err);
        alert("Deployment failed: " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <h2 className="text-3xl font-bold text-teal-700 mb-6">Sell Your GPU</h2>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-4">
        {presetReg && (
          <div className="mb-4">
            <label className="block text-sm font-medium">Registration</label>
            <code className="block text-xs text-gray-600 break-all">
              {presetReg}
            </code>
          </div>
        )}
        <input
          type="text"
          placeholder="GPU UUID"
          value={uuid}
          onChange={(e) => setUuid(e.target.value)}
          disabled={!!presetUuid}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          type="number"
          placeholder="Price (ETH)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <p className="text-gray-600">Commission: {commissionPerc}%</p>
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
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

// --- Listing Details page ---
function ListingDetail({ signer, handleRaiseDispute }) {
  const { address } = useParams();
  const navigate = useNavigate();
  const [listingCtr, setListingCtr] = useState(null);
  const [details, setDetails] = useState({
    seller: "",
    arbiter: "",
    buyer: "",
    deposited: false,
    releaseCount: 0,
    refundCount: 0,
    uuid: "",
    owners: [],
    hashes: [],
  });

  useEffect(() => {
    if (!signer) return;
    const ctr = new ethers.Contract(address, GPUListingJSON.abi, signer);
    setListingCtr(ctr);

    (async () => {
      // fetch listing data + registration address
      const [seller, arbiter, buyer, deposited, rc, fc, regAddr] =
        await Promise.all([
          ctr.seller(),
          ctr.arbiter(),
          ctr.buyer(),
          ctr.deposited(),
          ctr.release_ApprovalCount(),
          ctr.refund_ApprovalCount(),
          ctr.gpu_registration(),
        ]);

      // fetch registration details
      const regCtr = new ethers.Contract(
        regAddr,
        GPURegistrationJSON.abi,
        signer
      );
      const [uuid, owners, hashes] = await regCtr.getDetails();

      setDetails({
        seller,
        arbiter,
        buyer,
        deposited,
        releaseCount: rc,
        refundCount: fc,
        uuid,
        owners,
        hashes,
      });
    })();
  }, [signer, address]);

  const refresh = async () => {
    const d = await listingCtr.deposited();
    const rc = await listingCtr.release_ApprovalCount();
    const fc = await listingCtr.refund_ApprovalCount();
    setDetails((prev) => ({
      ...prev,
      deposited: d,
      releaseCount: rc,
      refundCount: fc,
    }));
  };

  const approve = async (fn) => {
    const tx = await listingCtr[fn]();
    await tx.wait();
    await refresh();
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-bold mb-4">Listing Details</h2>

          {[
            ["Contract", address],
            ["Seller", details.seller],
            ["Arbiter", details.arbiter],
            ["Buyer", details.buyer],
            ["UUID", details.uuid],
          ].map(([label, val]) => (
            <div className="flex" key={label}>
              <span className="w-32 font-medium">{label}:</span>
              <span className="break-all">{val}</span>
            </div>
          ))}

          <div className="flex items-center mt-4">
            <span className="w-32 font-medium">Deposited:</span>
            <span
              className={`px-2 py-1 rounded-full text-sm font-semibold ${details.deposited
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {details.deposited ? "Yes" : "No"}
            </span>
          </div>

          <div className="flex items-center mt-2">
            <span className="w-32 font-medium">Release Approvals:</span>
            <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {details.releaseCount}
            </span>
          </div>

          <div className="flex items-center mt-2">
            <span className="w-32 font-medium">Refund Approvals:</span>
            <span className="px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              {details.refundCount}
            </span>
          </div>

          <div className="mt-6 space-x-4">
            <button
              onClick={() => approve("approveRelease")}
              disabled={!details.deposited}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
              title="Confirm that the GPU has been delivered"
            >
              Confirm Completion
            </button>
            <button
              onClick={() => {
                handleRaiseDispute(address);
                navigate("/arbitration");
              }}
              disabled={!details.deposited}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
              title="Raise a dispute with the arbiter"
            >
              Raise Dispute
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Ownership History</h3>
          <ul className="list-disc list-inside">
            {details.owners.map((owner, i) => (
              <li key={i} className="break-all">{owner}</li>
            ))}
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-4">Benchmark Hashes</h3>
          <ul className="list-disc list-inside font-mono text-sm">
            {details.hashes.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
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

// --- Main App ---
export default function App() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [listedGpus, setListedGpus] = useState([]);
  const [registeredGpus, setRegisteredGpus] = useState([]);
  const [disputes, setDisputes] = useState([]);

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
  const handleRaiseDispute = (address) => {
    setDisputes(prev =>
      prev.includes(address) ? prev : [...prev, address]
    );
  };
  const addListing = ({ uuid, price }) => {
    setListedGpus(prev => [...prev, { uuid, price }]);
  };

  const addRegistration = ({ reg_contract, benchmark_hash, uuid, benchmark }) => {
    setRegisteredGpus(prev => [...prev, { reg_contract, benchmark_hash, uuid, benchmark }]);
  };

  const handleDeposit = async (amount, addr) => {
    try {
      const ctr = new ethers.Contract(addr, GPUListingJSON.abi, signer);
      const tx = await ctr.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      alert(`💰 Deposited ${amount} ETH`);
    } catch (err) {
      // MetaMask / RPC error codes
      const code = err.code ?? err.error?.code;
      const msg = err.message ?? err.error?.message ?? "";

      // insufficient funds for gas * price + value
      if (code === -32003 || /insufficient funds/i.test(msg)) {
        alert(
          "❌ Deposit failed: You don’t have enough Sepolia ETH in your wallet.\n" +
          "Please get some from a Sepolia faucet and try again."
        );
        return;
      }

      // user explicitly rejected the tx
      if (code === 4001 || code === "ACTION_REJECTED") {
        alert("⚠️ Deposit cancelled by user.");
        return;
      }

      // fallback for any other error
      console.error(err);
      alert(" Deposit failed: " + (msg || err));
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
              gpus={listedGpus}
              handleDeposit={handleDeposit}
              onSwitchSepolia={ensureSepolia}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterGPU
              account={account}
              signer={signer}
              onAddRegistration={addRegistration}
            />
          }
        />
        <Route
          path="/mygpus"
          element={
            <MyGPUs
              account={account}
              signer={signer}
              mygpus={registeredGpus}
            />
          }
        />
        <Route
          path="/sell"
          element={
            <Sell
              account={account}
              signer={signer}
              onAddListing={addListing}
            />
          }
        />
        <Route
          path="/arbitration"
          element={
            <ArbiterDashboard
              signer={signer}
              listedGpus={listedGpus}
              raisedDisputes={disputes}
              account={account}
            />
          }
        />

        <Route
          path="/listing/:address"
          element={
            <ListingDetail
              signer={signer}
              account={account}
              handleRaiseDispute={handleRaiseDispute}
            />
          }
        />
      </Routes>
    </Router>
  );
}
