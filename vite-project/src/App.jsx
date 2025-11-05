import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";

/**
 * Pink & Black Connect Wallet component
 * - Uses ethers v6 BrowserProvider
 * - Top-right Connect Wallet button triggers MetaMask (eth_requestAccounts)
 * - Shows address, ETH balance, chain name/id
 * - Listens for accountsChanged & chainChanged
 * - Includes switchNetwork(hexChainId, options) helper to prompt chain switch / add
 */

const TARGET_CHAIN = {
  // example: Ethereum Mainnet
  hexChainId: "0x1",
  name: "Ethereum Mainnet",
  // optional: add chain params if you want to prompt addChain (for other chains)
  // rpcUrls: ["https://mainnet.infura.io/v3/<YOUR-PROJECT-ID>"],
};

export default function App() {
  const [provider, setProvider] = useState(null);       // ethers BrowserProvider
  const [signer, setSigner] = useState(null);           // ethers Signer
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);         // string in ETH
  const [chainId, setChainId] = useState(null);         // numeric
  const [chainHex, setChainHex] = useState(null);       // hex string
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Init provider if injected
  const initProvider = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      setError("No injected wallet found (install MetaMask).");
      setProvider(null);
      setSigner(null);
      return;
    }
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      const network = await p.getNetwork();
      setChainId(network.chainId);
      setChainHex("0x" + network.chainId.toString(16));
      const accounts = await p.listAccounts();
      if (accounts.length) {
        const s = p.getSigner();
        setSigner(s);
        setAddress(ethers.getAddress(accounts[0]));
      }
    } catch (err) {
      setError(err.message || String(err));
    }
  }, []);

  useEffect(() => {
    initProvider();

    if (typeof window.ethereum !== "undefined") {
      const onAccountsChanged = (accs) => {
        if (!accs || accs.length === 0) {
          setAddress(null);
          setSigner(null);
          setBalance(null);
        } else {
          setAddress(ethers.getAddress(accs[0]));
          // create new signer from provider
          const p = new ethers.BrowserProvider(window.ethereum);
          setSigner(p.getSigner());
        }
      };
      const onChainChanged = async (hexChain) => {
        // hexChain is like "0x1"
        setChainHex(hexChain);
        setChainId(parseInt(hexChain, 16));
        // refresh provider and balances
        await initProvider();
      };

      window.ethereum.on("accountsChanged", onAccountsChanged);
      window.ethereum.on("chainChanged", onChainChanged);

      return () => {
        try {
          window.ethereum.removeListener("accountsChanged", onAccountsChanged);
          window.ethereum.removeListener("chainChanged", onChainChanged);
        } catch (_) {}
      };
    }
  }, [initProvider]);

  // Fetch balance whenever signer/address changes
  useEffect(() => {
    let mounted = true;
    const loadBalance = async () => {
      if (!provider || !address) {
        setBalance(null);
        return;
      }
      try {
        const bal = await provider.getBalance(address);
        if (!mounted) return;
        setBalance(ethers.formatEther(bal));
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      }
    };
    loadBalance();
    return () => {
      mounted = false;
    };
  }, [provider, address]);

  // Connect / trigger MetaMask
  const connect = async () => {
    setError(null);
    setConnecting(true);
    try {
      if (typeof window.ethereum === "undefined") {
        const go = confirm("MetaMask not found. Open download page?");
        if (go) window.open("https://metamask.io/download/", "_blank");
        setConnecting(false);
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length) {
        const p = new ethers.BrowserProvider(window.ethereum);
        const s = p.getSigner();
        setProvider(p);
        setSigner(s);
        const addr = ethers.getAddress(accounts[0]);
        setAddress(addr);
        const net = await p.getNetwork();
        setChainId(net.chainId);
        setChainHex("0x" + net.chainId.toString(16));
      }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setConnecting(false);
    }
  };

  // Network switch helper: try to switch; if chain not found, optionally add
  // hexChainId: "0x1" format
  // addChainParams optional: { chainId, chainName, nativeCurrency, rpcUrls, blockExplorerUrls }
  const switchNetwork = async (hexChainId, addChainParams = null) => {
    if (typeof window.ethereum === "undefined") {
      setError("No wallet available to switch network.");
      return;
    }
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError) {
      // 4902: chain not added
      if (switchError?.code === 4902 && addChainParams) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [addChainParams],
          });
        } catch (addError) {
          setError(addError?.message || String(addError));
        }
      } else {
        setError(switchError?.message || String(switchError));
      }
    }
  };

  // UI
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logo}>P</div>
          <div>
            <div style={styles.title}>DApp</div>
            <div style={styles.subtitle}>Minimal wallet connect demo</div>
          </div>
        </div>

        <div>
          <button
            onClick={() => (address ? null : connect())}
            style={{ ...styles.connectBtn, opacity: connecting ? 0.7 : 1 }}
            disabled={connecting}
            title={address ? "Already connected" : "Connect with MetaMask"}
          >
            {address ? `${short(address)}` : connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={{ margin: 0, color: "#fff" }}>Connect your MetaMask</h2>
          <div style={styles.hint}>Click <strong>Connect Wallet</strong> at top-right. MetaMask will open and ask to connect.</div>

          <div style={{ marginTop: 18 }}>
            <div style={styles.row}><strong>Status:</strong> {address ? "Connected" : "Not connected"}</div>
            <div style={styles.row}><strong>Address:</strong> {address ? address : "—"}</div>
            <div style={styles.row}><strong>Balance:</strong> {balance ? `${formatNumber(balance)} ETH` : "—"}</div>
            <div style={styles.row}><strong>Chain:</strong> {chainHex ? `${chainHex} (id ${chainId})` : "—"}</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              style={styles.smallBtn}
              onClick={() => switchNetwork(TARGET_CHAIN.hexChainId)}
            >
              Switch to {TARGET_CHAIN.name}
            </button>

            <button
              style={{ ...styles.smallBtn, marginLeft: 8 }}
              onClick={() => {
                // Example: show explorer link for address if connected
                if (address) window.open(`https://etherscan.io/address/${address}`, "_blank");
                else alert("Connect first");
              }}
            >
              View on Etherscan
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}
        </div>
      </main>
    </div>
  );
}

// small helpers
function short(addr = "") {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
function formatNumber(n) {
  // ensure display with up to 6 decimals trimmed
  const x = Number(n);
  if (Number.isNaN(x)) return n;
  return x.toFixed(6).replace(/\.?0+$/, "");
}

// Inline styles (pink & black theme)
const styles = {
  app: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#0b0b0b,#141414)", color: "#fff", fontFamily: "Inter, system-ui, Arial, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px" },
  brand: { display: "flex", gap: 12, alignItems: "center" },
  logo: { width: 48, height: 48, borderRadius: 8, background: "linear-gradient(135deg,#ff4da6,#ff2d95)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  title: { fontSize: 20, marginBottom: 2 },
  subtitle: { fontSize: 13, color: "#bdbdbd" },
  connectBtn: { background: "#ff4da6", color: "#0b0b0b", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 18px rgba(255,77,166,0.12)" },
  main: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 },
  card: { background: "linear-gradient(180deg,#151515,#1a1a1a)", borderRadius: 12, padding: 28, width: "min(720px,94%)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" },
  hint: { marginTop: 8, color: "#aaa", fontSize: 14 },
  row: { marginTop: 10, color: "#e6e6e6" },
  smallBtn: { background: "transparent", color: "#ff4da6", border: "1px solid rgba(255,77,166,0.18)", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
  error: { marginTop: 12, color: "#ff8aa8", background: "rgba(255,77,166,0.06)", padding: 10, borderRadius: 8 }
};
