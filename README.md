# CRUD App on Solana

A decentralized CRUD (Create, Read, Update, Delete) application built on the Solana blockchain using **Rust, Anchor, and React**.

The application allows users to manage journal entries on-chain. Each journal entry is associated with its owner's wallet and stored using a Program Derived Address (PDA).

## Features

- **Create:** Create journal entries with a title and content.
- **Read:** Fetch journal entries associated with the connected wallet.
- **Update:** Modify existing journal entries.
- **Delete:** Remove journal entries.
- **Wallet Integration:** Connect a Solana wallet to interact with the application.
- **PDA-Based Accounts:** Derive journal entry accounts using deterministic addresses.
- **On-chain Ownership:** Associate entries with their respective wallet owners.

## Tech Stack

### Blockchain
- Solana
- Rust
- Anchor Framework
- Program Derived Addresses (PDAs)

### Frontend
- React
- TypeScript
- Vite
- Solana Web3.js
- Solana Wallet Adapter

## Project Structure

```text
crud-app/
├── programs/
│   └── crud-app/
│       └── src/
│           └── lib.rs
├── tests/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── ...
│   └── package.json
├── Anchor.toml
├── Cargo.toml
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Rust and Cargo
- Solana CLI
- Anchor CLI
- Node.js and npm
- A Solana wallet such as Phantom

### 1. Clone the Repository

```bash
git clone https://github.com/Rav1Chauhan/CRUD-APP-ON-SOLANA.git
cd CRUD-APP-ON-SOLANA
```

### 2. Build the Solana Program

```bash
anchor build
```

### 3. Run Tests

```bash
anchor test
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start the Frontend

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## How It Works

1. The user connects their Solana wallet.
2. The frontend initializes the Anchor program.
3. A PDA is derived for the journal entry.
4. The user submits a transaction to create, update, or delete an entry.
5. The Solana program validates the accounts and executes the requested instruction.
6. The frontend fetches and displays the user's journal entries.

## Learning Objectives

This project demonstrates practical experience with:

- Building Solana programs using Rust and Anchor.
- Understanding PDAs and account derivation.
- Managing on-chain account data.
- Implementing CRUD instructions.
- Integrating Anchor programs with React.
- Connecting wallets using Solana Wallet Adapter.
- Interacting with Solana programs from a TypeScript frontend.

## Author

**Ravi Chauhan**

- GitHub: [@Rav1Chauhan](https://github.com/Rav1Chauhan)
- LinkedIn: [Ravi Chauhan](https://www.linkedin.com/in/rav1chauhan/)

---

If you find this project useful, consider giving the repository a star!
