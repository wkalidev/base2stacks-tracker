import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
  name: "Test token metadata",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-name', [], deployer.address),
      Tx.contractCall('b2s-token', 'get-symbol', [], deployer.address),
      Tx.contractCall('b2s-token', 'get-decimals', [], deployer.address),
    ]);
    
    block.receipts[0].result.expectOk().expectAscii("Base2Stacks Token");
    block.receipts[1].result.expectOk().expectAscii("B2S");
    block.receipts[2].result.expectOk().expectUint(6);
  }
});

Clarinet.test({
  name: "Test initial balance of deployer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-balance', [
        types.principal(deployer.address)
      ], deployer.address),
    ]);
    
    // Initial supply: 400M tokens (400000000 * 10^6)
    block.receipts[0].result.expectOk().expectUint(400000000000000);
  }
});

Clarinet.test({
  name: "Test token transfer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(1000000), // 1 B2S
        types.principal(deployer.address),
        types.principal(wallet1.address),
        types.none()
      ], deployer.address),
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Check new balances
    let balanceBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-balance', [
        types.principal(wallet1.address)
      ], wallet1.address),
    ]);
    
    balanceBlock.receipts[0].result.expectOk().expectUint(1000000);
  }
});

Clarinet.test({
  name: "Test bridge transaction tracking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const tracker = accounts.get('wallet_1')!;
    const txHash = new Uint8Array(32).fill(1); // Mock tx hash
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'track-bridge-tx', [
        types.buff(txHash),
        types.ascii("BASE"),
        types.ascii("STACKS"),
        types.uint(1000000000) // 1000 tokens bridged
      ], tracker.address),
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Check tracker stats
    let statsBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-tracker-stats', [
        types.principal(tracker.address)
      ], tracker.address),
    ]);
    
    const stats = statsBlock.receipts[0].result.expectTuple();
    assertEquals(stats['total-tracked'], types.uint(1));
  }
});

Clarinet.test({
  name: "Test bridge verification and rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const tracker = accounts.get('wallet_1')!;
    const txHash = new Uint8Array(32).fill(2);
    
    // Track transaction
    let trackBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'track-bridge-tx', [
        types.buff(txHash),
        types.ascii("STACKS"),
        types.ascii("BASE"),
        types.uint(500000000)
      ], tracker.address),
    ]);
    
    trackBlock.receipts[0].result.expectOk();
    
    // Verify transaction (only deployer can do this)
    let verifyBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'verify-bridge-tx', [
        types.buff(txHash)
      ], deployer.address),
    ]);
    
    verifyBlock.receipts[0].result.expectOk().expectBool(true);
    
    // Check tracker received rewards (10 B2S = 10000000)
    let balanceBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-balance', [
        types.principal(tracker.address)
      ], tracker.address),
    ]);
    
    balanceBlock.receipts[0].result.expectOk().expectUint(10000000);
  }
});

Clarinet.test({
  name: "Test daily claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const claimer = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'claim-daily-reward', [], claimer.address),
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Try to claim again (should fail)
    let secondClaimBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'claim-daily-reward', [], claimer.address),
    ]);
    
    secondClaimBlock.receipts[0].result.expectErr().expectUint(104); // err-already-claimed
  }
});

Clarinet.test({
  name: "Test staking mechanism",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const staker = accounts.get('wallet_1')!;
    
    // First transfer some tokens to staker
    let transferBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(100000000), // 100 B2S
        types.principal(deployer.address),
        types.principal(staker.address),
        types.none()
      ], deployer.address),
    ]);
    
    transferBlock.receipts[0].result.expectOk();
    
    // Stake tokens
    let stakeBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(50000000) // 50 B2S
      ], staker.address),
    ]);
    
    stakeBlock.receipts[0].result.expectOk().expectBool(true);
    
    // Check staked balance
    let stakedBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-staked-balance', [
        types.principal(staker.address)
      ], staker.address),
    ]);
    
    const stakedInfo = stakedBlock.receipts[0].result.expectTuple();
    assertEquals(stakedInfo['amount'], types.uint(50000000));
  }
});

Clarinet.test({
  name: "Test unstaking mechanism",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const staker = accounts.get('wallet_2')!;
    
    // Setup: transfer and stake
    let setupBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(200000000),
        types.principal(deployer.address),
        types.principal(staker.address),
        types.none()
      ], deployer.address),
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(100000000)
      ], staker.address),
    ]);
    
    // Unstake half
    let unstakeBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'unstake', [
        types.uint(50000000)
      ], staker.address),
    ]);
    
    unstakeBlock.receipts[0].result.expectOk().expectBool(true);
    
    // Check remaining staked balance
    let stakedBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-staked-balance', [
        types.principal(staker.address)
      ], staker.address),
    ]);
    
    const stakedInfo = stakedBlock.receipts[0].result.expectTuple();
    assertEquals(stakedInfo['amount'], types.uint(50000000));
  }
});

Clarinet.test({
  name: "Test unauthorized mint attempt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'mint', [
        types.uint(1000000),
        types.principal(wallet1.address)
      ], wallet1.address), // Not the contract owner
    ]);
    
    block.receipts[0].result.expectErr().expectUint(100); // err-owner-only
  }
});
