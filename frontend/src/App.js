// src/App.js
import { useEffect, useState, useCallback } from "react";
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
import ShippingAndMap from "./components/ShippingAndMap";
import { FaGavel } from "react-icons/fa";
const ARBITER_ADDRESS = '0x482411C3819C39c69b9243E054F434d5e7218e3d'
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
export async function geocodeAddress(address) {
  // For now just return a fixed location if address matches our example
  if (address.includes("Mountain View")) {
    return { lat: 37.4221, lng: -122.0841 };
  }
  // Fallback: return null or a default
  return null;
}
// --- Home page ---
function Home({ account, gpus, handleDeposit, onSwitchSepolia, onSwitchWallet }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <header className="bg-white shadow-md rounded-lg px-6 py-4 flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        <div className="flex space-x-3">
          <button
            onClick={onSwitchSepolia}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            <FaSyncAlt className="mr-2" /> Sepolia
          </button>
          <button
            onClick={onSwitchWallet}
            className="flex items-center bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md transition"
          >
            Switch Wallet
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-mono text-gray-700 truncate max-w-xs">
            {account || "Not connected"}
          </span>
        </div>
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
                    onClick={async () => {
                      if (!valid) return;
                      await handleDeposit(price, uuid);
                      navigate(`/listing/${uuid}`);
                    }}
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
function ArbiterDashboard({ signer, listedGpus, raisedDisputes, account, onCompletePurchase }) {
  const [disputes, setDisputes] = useState([]);

  const loadDisputes = useCallback(async () => {
    if (!signer) return;

    const onChain = [];
    for (let { uuid: address } of listedGpus) {
      const ctr = new ethers.Contract(address, GPUListingJSON.abi, signer);
      const [arb, deposited, r, f] = await Promise.all([
        ctr.arbiter(),
        ctr.deposited(),
        ctr.release_ApprovalCount(),
        ctr.refund_ApprovalCount(),
      ]);

      const isArbiter = arb.toLowerCase() === ARBITER_ADDRESS.toLowerCase();
      const hasIssue = Number(r) > 0 || Number(f) > 0;

      if (isArbiter && deposited && hasIssue) {
        onChain.push(address);
      }
    }

    setDisputes(Array.from(new Set([...onChain, ...raisedDisputes])));
  }, [signer, listedGpus, raisedDisputes]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleApprove = async (address, method) => {
    try {
      const ctr = new ethers.Contract(address, GPUListingJSON.abi, signer);
      const tx = await ctr[method]();
      await tx.wait();

      if (method === "approveRelease") {
        const rNew = Number(await ctr.release_ApprovalCount());
        if (rNew === 2) {
          const regAddr = await ctr.gpu_registration();
          const regCtr = new ethers.Contract(regAddr, GPURegistrationJSON.abi, signer);
          const [uuid, , hashes] = await regCtr.getDetails();
          const benchmarkHash = hashes[hashes.length - 1];
          const priceWei = await ctr.price();
          const price = ethers.formatEther(priceWei);
          const buyer = await ctr.buyer();

          // Save to buyer's GPU map
          onCompletePurchase({
            uuid,
            regContract: regAddr,
            benchmarkHash,
            price,
            buyer,
          });
        }
      }

      alert(`✅ ${method} succeeded on ${address}`);
      await loadDisputes();
    } catch (err) {
      console.error(err);
      alert(`❌ ${method} failed: ${err.reason || err.message}`);
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
      {disputes.length === 0 ? (
        <p className="text-gray-600">No active disputes.</p>
      ) : (
        <div className="space-y-4">
          {disputes.map((addr) => (
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
    await new Promise((r) => setTimeout(r, 3000));
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
function MyGPUs({ account, registeredGpusMap, benchmarks }) {
  const navigate = useNavigate();
  const mygpus = registeredGpusMap[account?.toLowerCase()] || [];
  useEffect(() => {
    console.log("🧠 Current account:", account);
    console.log("📦 RegisteredGpusMap keys:", Object.keys(registeredGpusMap));
    console.log("🧩 GPUs for current account:", registeredGpusMap[account]);
  }, [account, registeredGpusMap]);
  if (mygpus.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-white p-8">
        <p className="text-2xl text-gray-600 mb-4">No GPUs found</p>
        <p className="text-gray-500 mb-8">Register one or purchase from the market.</p>
        <Link
          to="/"
          className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded transition"
        >
          ← Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 font-sans">
      <h2 className="text-3xl font-bold text-teal-700 mb-8">My GPUs</h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {mygpus.map((gpu) => {

          const fullBench = benchmarks[gpu.benchmark_hash] || {};
          return (
            <div
              key={gpu.uuid}
              className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
            >
              <GPUCard
                gpu={{
                  ...gpu,
                  benchmark: fullBench
                }}
              />

              {/* Footer with action */}
              <div className="p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() =>
                    navigate(`/sell?reg=${gpu.reg_contract}&uuid=${gpu.uuid}`)
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                >
                  List for Sale
                </button>
              </div>
            </div>
          );
        })}
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
        ARBITER_ADDRESS,
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
function ListingDetail({
  signer,
  handleRaiseDispute,
  account,
  onCompletePurchase,  
}) {
  const { address } = useParams();

  const [listingCtr, setListingCtr] = useState(null);
  const [details, setDetails] = useState({
    seller: "", arbiter: "", buyer: "",
    deposited: false, uuid: "",
    owners: [], hashes: [],
  });
  const [sellerLoc, setSellerLoc] = useState(null);

  const [releaseCount, setReleaseCount] = useState(0);
  const [refundCount, setRefundCount] = useState(0);
  const [hasReleaseApproved, setHasReleaseApproved] = useState(false);
  const [hasRefundApproved, setHasRefundApproved] = useState(false);

  // 1) Instantiate & fetch initial data
  useEffect(() => {
    if (!signer) return;
    const ctr = new ethers.Contract(address, GPUListingJSON.abi, signer);
    setListingCtr(ctr);

    (async () => {
      const [seller, arbiter, buyer, deposited, regAddr] = await Promise.all([
        ctr.seller(), ctr.arbiter(), ctr.buyer(),
        ctr.deposited(), ctr.gpu_registration(),
      ]);
      const regCtr = new ethers.Contract(regAddr, GPURegistrationJSON.abi, signer);
      const [uuid, owners, hashes] = await regCtr.getDetails();

      setDetails({ seller, arbiter, buyer, deposited, uuid, owners, hashes });
      await reloadApprovalsAndDeposit(ctr);
    })();
  }, [signer, address]);

  // 2) Geocode seller
  useEffect(() => {
    if (!details.seller) return;
    geocodeAddress(details.seller).then(setSellerLoc);
  }, [details.seller]);

  // 3) Reload counts & deposited flag
  const reloadApprovalsAndDeposit = useCallback(
    async (ctr = listingCtr) => {
      if (!ctr || !account) return { rc: 0, fc: 0 };
      const [rcRaw, approvedR, fcRaw, approvedF, deposited] = await Promise.all([
        ctr.release_ApprovalCount(),
        ctr.approvedRelease(account),
        ctr.refund_ApprovalCount(),
        ctr.approvedRefund(account),
        ctr.deposited(),
      ]);
      const rc = Number(rcRaw), fc = Number(fcRaw);

      setReleaseCount(rc);
      setHasReleaseApproved(approvedR);
      setRefundCount(fc);
      setHasRefundApproved(approvedF);
      setDetails(d => ({ ...d, deposited }));
      return { rc, fc };
    },
    [listingCtr, account]
  );

  // 4) Refresh owners & hashes once releaseCount hits 2
  useEffect(() => {
    if (releaseCount !== 2 || !listingCtr) return;
    (async () => {
      const regAddr = await listingCtr.gpu_registration();
      const regCtr = new ethers.Contract(regAddr, GPURegistrationJSON.abi, signer);
      const [, owners, hashes] = await regCtr.getDetails();
      setDetails(d => ({ ...d, owners, hashes }));
    })();
  }, [releaseCount, listingCtr, signer]);

  // 5) Unified approve handler
  async function handleApprove(fn) {
    try {
      const tx = await listingCtr[fn]();
      await tx.wait();

      const { rc, fc } = await reloadApprovalsAndDeposit(listingCtr);

      if (fn === "approveRefund" && fc === 1) {
        handleRaiseDispute(address);
      }

      // once two release approvals land, record the purchase
      if (fn === "approveRelease" && rc === 2) {
        const regAddr = await listingCtr.gpu_registration();
        const regCtr = new ethers.Contract(regAddr, GPURegistrationJSON.abi, signer);
        const [uuid, , hashes] = await regCtr.getDetails();
        const benchmarkHash = hashes[hashes.length - 1];
        const priceWei = await listingCtr.price();
        const price = ethers.formatEther(priceWei);
        const buyerAddr = await listingCtr.buyer();
        onCompletePurchase({
          uuid,
          regContract: regAddr,
          benchmarkHash,
          price,
          buyer: buyerAddr,
        });

        alert("💰 Funds released and recorded in My GPUs!");
        setDetails(d => ({ ...d, deposited: false }));
      }

      if (fn === "approveRefund" && fc === 2) {
        alert("🔄 Funds refunded to buyer!");
        setDetails(d => ({ ...d, deposited: false }));
      }
    } catch (e) {
      console.error(`${fn}() failed:`, e.reason || e.message);
      alert(`${fn} failed: ${e.reason || e.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-bold mb-4">Listing Details</h2>

          {/* Core details */}
          {[
            ["Contract", address],
            ["Seller", details.seller],
            ["Arbiter", details.arbiter],
            ["Buyer", details.buyer],
            ["UUID", details.uuid],
          ].map(([lbl, val]) => (
            <div className="flex mb-2" key={lbl}>
              <span className="w-32 font-medium">{lbl}:</span>
              <span className="break-all">{val}</span>
            </div>
          ))}

          {/* Deposited flag */}
          <div className="flex items-center mt-4 mb-6">
            <span className="w-32 font-medium">Deposited:</span>
            <span className={`px-2 py-1 rounded-full text-sm font-semibold ${details.deposited ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
              {details.deposited ? "Yes" : "No"}
            </span>
          </div>

          {/* Shipping & Map */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Shipping Info</h3>
            <ShippingAndMap
              sellerLocation={sellerLoc}
              onBuyerAddress={(addr, pos) =>
                setDetails(d => ({ ...d, buyer: addr }))
              }
            />
          </section>

          {/* Approval counters */}
          <div className="flex items-center mb-4">
            <span className="w-32 font-medium">Release:</span>
            <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              {releaseCount} / 2
            </span>
          </div>
          <div className="flex items-center mb-6">
            <span className="w-32 font-medium">Refund:</span>
            <span className="px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              {refundCount} / 2
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => handleApprove("approveRelease")}
              disabled={!details.deposited || hasReleaseApproved}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Confirm Completion
            </button>
            <button
              onClick={() => handleApprove("approveRefund")}
              disabled={!details.deposited || hasRefundApproved}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Raise Dispute & Refund
            </button>
          </div>
        </div>

        {/* Ownership & Hash history */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Ownership History</h3>
          <ul className="list-disc list-inside">
            {details.owners.map((o, i) => (
              <li key={i} className="break-all">{o}</li>
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
  const [myGpusMap, setMyGpusMap] = useState({});
  const [disputes, setDisputes] = useState([]);
  const [benchmarks, setBenchmarks] = useState({});
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    (async () => {
      if (!(await ensureSepolia())) return;
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);

      await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      setSigner(s);
      setAccount((await s.getAddress()).toLowerCase());
    })();
  }, []);
  const handleRaiseDispute = (address) => {
    setDisputes(prev =>
      prev.includes(address) ? prev : [...prev, address]
    );
  };
  const switchWallet = async () => {
    if (!window.ethereum) {
      alert("🦊 Please install MetaMask");
      return;
    }
    try {

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      setProvider(newProvider);
      setSigner(newSigner);
      setAccount(accounts[0]);
    } catch (err) {
      console.error(err);
      alert("Could not switch wallet: " + (err.message || err));
    }
  };
  const addListing = ({ uuid, price }) => {
    setListedGpus(prev => [...prev, { uuid, price }]);
  };
  function completePurchase({ uuid, regContract, benchmarkHash, price, buyer }) {
    const buyerKey = buyer.toLowerCase(); 
    console.log("📦 completePurchase triggered", {
      uuid, regContract, benchmarkHash, price, buyer, buyerKey
    });
  
    setMyGpusMap(prev => {
      const existing = prev[buyerKey] || [];
  
      const alreadyOwned = existing.some(gpu =>
        gpu.uuid === uuid && gpu.reg_contract === regContract
      );
  
      if (alreadyOwned) {
        console.log("⚠️ GPU already exists for this buyer.");
        return prev;
      }
  
      const newMap = {
        ...prev,
        [buyerKey]: [
          ...existing,
          {
            uuid,
            reg_contract: regContract,
            benchmark_hash: benchmarkHash,
            price,
          },
        ],
      };
  
      console.log("✅ Updated GPU map", newMap);
      return newMap;
    });
  }
  const addRegistration = (gpu) => {

    setBenchmarks(prev => ({
      ...prev,
      [gpu.benchmark_hash]: gpu.benchmark
    }));

    setMyGpusMap(prev => ({
      ...prev,
      [account]: [
        ...(prev[account] || []),
        {
          uuid: gpu.uuid,
          reg_contract: gpu.reg_contract,
          benchmark_hash: gpu.benchmark_hash,
        }
      ]
    }));
  };

  const handleDeposit = async (amount, addr) => {
    try {
      const ctr = new ethers.Contract(addr, GPUListingJSON.abi, signer);
      const tx = await ctr.deposit({ value: ethers.parseEther(amount) });
      const regAddress = await ctr.gpu_registration();
      const regCtr = new ethers.Contract(regAddress, GPURegistrationJSON.abi, signer);
      const [uuid, , hashes] = await regCtr.getDetails();
      const mostRecentHash = hashes[hashes.length - 1];

      await tx.wait();
      alert(`💰 Deposited ${amount} ETH`);

    } catch (err) {
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
              onSwitchWallet={switchWallet}
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
              registeredGpusMap={myGpusMap}
              benchmarks={benchmarks}
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
              onCompletePurchase={completePurchase}
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
              onCompletePurchase={completePurchase}
            />
          }
        />
      </Routes>
    </Router>
  );
}
