import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { CrudApp } from "../target/types/crud_app";


describe("crud-app", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.crudApp as Program<CrudApp>;
  const owner = provider.wallet.publicKey;

  // Unique suffix so reruns on devnet don't collide with existing PDAs.
  // Keep titles <= 32 bytes (PDA seed limit).
  const run = Date.now().toString(36);

  const deriveEntry = (title: string, ownerKey: PublicKey = owner) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from(title), ownerKey.toBuffer()],
      program.programId
    )[0];

  // Helper: assert a promise rejects, optionally matching an error string.
  const expectFail = async (p: Promise<unknown>, match?: string) => {
    try {
      await p;
    } catch (err: any) {
      if (match) {
        const text = `${err?.error?.errorCode?.code ?? ""} ${err?.message ?? ""} ${err}`;
        assert.include(text, match);
      }
      return;
    }
    assert.fail("Expected the transaction to fail, but it succeeded");
  };

  it("creates a journal entry", async () => {
    const title = `create-${run}`;
    const entry = deriveEntry(title);

    await program.methods
      .create(title, "hello world")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    const account = await program.account.journal.fetch(entry);
    assert.equal(account.title, title);
    assert.equal(account.message, "hello world");
    assert.ok(account.owner.equals(owner));
  });

  it("fails to create a duplicate entry (same title + owner)", async () => {
    const title = `dup-${run}`;
    const entry = deriveEntry(title);

    await program.methods
      .create(title, "first")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    await expectFail(
      program.methods
        .create(title, "second")
        .accounts({ journalEntry: entry, owner } as any)
        .rpc()
    );

    const account = await program.account.journal.fetch(entry);
    assert.equal(account.message, "first");
  });

  it("rejects a message longer than 50 bytes", async () => {
    const title = `longmsg-${run}`;
    const entry = deriveEntry(title);

    await expectFail(
      program.methods
        .create(title, "x".repeat(51))
        .accounts({ journalEntry: entry, owner } as any)
        .rpc(),
      "MessageTooLong"
    );
  });

  it("cannot derive a PDA for a title over 32 bytes", () => {
    assert.throws(() => deriveEntry("t".repeat(33)));
  });

  it("updates the message", async () => {
    const title = `update-${run}`;
    const entry = deriveEntry(title);

    await program.methods
      .create(title, "before")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    await program.methods
      .update(title, "after")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    const account = await program.account.journal.fetch(entry);
    assert.equal(account.message, "after");
    assert.equal(account.title, title);
  });

  it("rejects an update with a message over 50 bytes", async () => {
    const title = `updlong-${run}`;
    const entry = deriveEntry(title);

    await program.methods
      .create(title, "short")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    await expectFail(
      program.methods
        .update(title, "y".repeat(51))
        .accounts({ journalEntry: entry, owner } as any)
        .rpc(),
      "MessageTooLong"
    );
  });

  it("prevents another wallet from updating someone else's entry", async () => {
    const title = `auth-upd-${run}`;
    const entry = deriveEntry(title);

    await program.methods
      .create(title, "mine")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    const attacker = Keypair.generate();
;

    await expectFail(
      program.methods
        .update(title, "hacked")
        .accounts({ journalEntry: entry, owner: attacker.publicKey } as any)
        .signers([attacker])
        .rpc()
    );

    const account = await program.account.journal.fetch(entry);
    assert.equal(account.message, "mine");
  });

  it("deletes an entry and refunds rent to the owner", async () => {
    const title = `delete-${run}`;
    const entry = deriveEntry(title);

    await program.methods
      .create(title, "bye")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    const rent = await provider.connection.getBalance(entry);
    assert.isAbove(rent, 0);

    await program.methods
      .delete(title)
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    const info = await provider.connection.getAccountInfo(entry);
    assert.isNull(info);
    await expectFail(program.account.journal.fetch(entry));
  });

  it("prevents another wallet from deleting someone else's entry", async () => {
    const title = `auth-del-${run}`;
    const entry = deriveEntry(title);

    await program.methods
      .create(title, "keep me")
      .accounts({ journalEntry: entry, owner } as any)
      .rpc();

    const attacker = Keypair.generate();


    await expectFail(
      program.methods
        .delete(title)
        .accounts({ journalEntry: entry, owner: attacker.publicKey } as any)
        .signers([attacker])
        .rpc()
    );

    const account = await program.account.journal.fetch(entry);
    assert.equal(account.message, "keep me");
  });
});
