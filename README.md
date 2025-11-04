# Wallet integeration with simple one page UI

A minimal **pink & black** themed single-page React app that demonstrates **Connect Wallet (MetaMask)** functionality. The app places a **Connect Wallet** button in the top-right, triggers MetaMask (`eth_requestAccounts`), displays the connected address and ETH balance, and listens for account / chain changes. It uses **ethers v6** and is built with Vite.

---

## Features

* Top-right **Connect Wallet** button that triggers MetaMask.
* Shows connected address and ETH balance.
* Listens for `accountsChanged` and `chainChanged` events.
* Network switch helper (`wallet_switchEthereumChain`) with optional chain-add flow.
* Clean pink & black UI that you can reuse.

---

## Prerequisites

* Node.js (v16+ recommended)
* npm or yarn
* MetaMask browser extension (or other injected EVM wallet) for testing

---

## Quick start

```bash
# create the Vite React app (if you haven't already)
npm create vite@latest pink-black-dapp -- --template react
cd pink-black-dapp

# install deps
npm install
npm install ethers@^6.0.0

# replace src/App.jsx with the provided App.jsx file
# (or copy the component into your app)

# run dev server
npm run dev
# open the URL printed by Vite (e.g. http://localhost:5173)
```

---

If you used the exact single-file React component supplied, place it at `src/App.jsx`.

---

## App details & API notes

* **Provider**: Uses `ethers` **v6** `BrowserProvider` which wraps `window.ethereum`.
* **Connect flow**: `window.ethereum.request({ method: 'eth_requestAccounts' })` triggers MetaMask popup.
* **Address checksum**: Uses `ethers.getAddress()` to ensure checksum format.
* **Events**: Subscribes to `accountsChanged` and `chainChanged` to keep UI in sync.
* **Balance**: Fetched via `provider.getBalance(address)` and formatted with `ethers.formatEther()`.
* **Network switch**: Helper `switchNetwork(hexChainId, addChainParams)` calls `wallet_switchEthereumChain`. If the requested chain is unknown, you can pass `addChainParams` (RPC URL, chainName, nativeCurrency) to call `wallet_addEthereumChain`.

---

## Troubleshooting

* **MetaMask not opening or connecting**: Ensure you're testing on a secure origin ([http://localhost](http://localhost) or https). Avoid opening the file via `file://` — use `npm run dev` or `python -m http.server`.
* **User rejects connection**: MetaMask will throw; the app catches and displays an error. Ask the user to accept the connection request.
* **Wrong network / chain**: Use the `Switch to <network>` button (implemented in the demo) or call the `switchNetwork` helper with correct `hexChainId` (e.g., `0x1` for Mainnet, `0x5` for Goerli if still supported).
* **ethers version mismatch**: The component uses ethers v6 APIs (`BrowserProvider`, `formatEther`). If you use ethers v5, update the code (e.g., `new ethers.providers.Web3Provider(window.ethereum)` and `ethers.utils.formatEther`).

---

## License

MIT


