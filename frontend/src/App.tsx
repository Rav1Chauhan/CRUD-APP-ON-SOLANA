import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";

type Entry = { pubkey: PublicKey; title: string; message: string };

const enc = new TextEncoder();
const byteLen = (s: string) => enc.encode(s).length;

const errorText = (err: any): string =>
  err?.error?.errorMessage ?? err?.message ?? String(err);

export default function App() {
  const { publicKey } = useWallet();
  const program = useProgram();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!program || !publicKey) {
      setEntries([]);
      return;
    }
    // Only this wallet's entries: `owner` is the first field after the 8-byte discriminator
    const accounts = await program.account.journal.all([
      { memcmp: { offset: 8, bytes: publicKey.toBase58() } },
    ]);
    setEntries(
      accounts.map((a) => ({
        pubkey: a.publicKey,
        title: a.account.title,
        message: a.account.message,
      }))
    );
  }, [program, publicKey]);

  useEffect(() => {
    load().catch((e) => setStatus({ kind: "err", text: errorText(e) }));
  }, [load]);

  const entryPda = (t: string) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from(t), publicKey!.toBuffer()],
      program!.programId
    )[0];

  // Runs a transaction, shows the result, then reloads the list
  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(true);
    setStatus(null);
    try {
      const sig = await fn();
      setStatus({ kind: "ok", text: `${label} ✓  (${sig.slice(0, 12)}…)` });
      await load();
    } catch (e) {
      setStatus({ kind: "err", text: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  const create = () => {
    if (!program || !publicKey) return;
    if (!title.trim()) return setStatus({ kind: "err", text: "Title is required." });
    if (byteLen(title) > 32)
      return setStatus({ kind: "err", text: "Title must be 32 bytes or fewer." });
    if (byteLen(message) > 50)
      return setStatus({ kind: "err", text: "Message must be 50 bytes or fewer." });

    run("Created", async () => {
      const sig = await program.methods
        .create(title, message)
        .accounts({ journalEntry: entryPda(title), owner: publicKey } as any)
        .rpc();
      setTitle("");
      setMessage("");
      return sig;
    });
  };

  const saveEdit = (entry: Entry) => {
    if (!program || !publicKey) return;
    if (byteLen(editText) > 50)
      return setStatus({ kind: "err", text: "Message must be 50 bytes or fewer." });

    run("Updated", async () => {
      const sig = await program.methods
        .update(entry.title, editText)
        .accounts({ journalEntry: entry.pubkey, owner: publicKey } as any)
        .rpc();
      setEditing(null);
      return sig;
    });
  };

  const remove = (entry: Entry) => {
    if (!program || !publicKey) return;
    run("Deleted", () =>
      program.methods
        .delete(entry.title)
        .accounts({ journalEntry: entry.pubkey, owner: publicKey } as any)
        .rpc()
    );
  };

  return (
    <div className="container">
      <header>
        <h1>On-chain Journal</h1>
        <WalletMultiButton />
      </header>

      {!publicKey ? (
        <p className="muted">Connect a wallet (set to Devnet) to get started.</p>
      ) : (
        <>
          <section className="card">
            <h2>New entry</h2>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
            <small className={byteLen(title) > 32 ? "over" : "muted"}>
              {byteLen(title)}/32 bytes
            </small>
            <textarea
              placeholder="Message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
            />
            <small className={byteLen(message) > 50 ? "over" : "muted"}>
              {byteLen(message)}/50 bytes
            </small>
            <button onClick={create} disabled={busy}>
              {busy ? "Waiting…" : "Create entry"}
            </button>
          </section>

          {status && <div className={`status ${status.kind}`}>{status.text}</div>}

          <section>
            <h2>Your entries ({entries.length})</h2>
            {entries.length === 0 && <p className="muted">No entries yet.</p>}
            {entries.map((e) => (
              <div className="card entry" key={e.pubkey.toBase58()}>
                <h3>{e.title}</h3>
                {editing === e.pubkey.toBase58() ? (
                  <>
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(ev) => setEditText(ev.target.value)}
                      disabled={busy}
                    />
                    <small className={byteLen(editText) > 50 ? "over" : "muted"}>
                      {byteLen(editText)}/50 bytes
                    </small>
                    <div className="row">
                      <button onClick={() => saveEdit(e)} disabled={busy}>
                        Save
                      </button>
                      <button className="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{e.message || <span className="muted">(empty)</span>}</p>
                    <div className="row">
                      <button
                        className="ghost"
                        disabled={busy}
                        onClick={() => {
                          setEditing(e.pubkey.toBase58());
                          setEditText(e.message);
                        }}
                      >
                        Edit
                      </button>
                      <button className="danger" disabled={busy} onClick={() => remove(e)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
