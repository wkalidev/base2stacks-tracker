import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
  name: "Test token metadata",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-name', [], deployer.address),
      Tx.contractCall('b2s-token', 'get-symbol', [], deployer.address),
      Tx.contractCall('b2s-token', 'get-decimals', [], deployer.address),
      Tx.contractCall('b2s-token', 'get-token-uri', [], deployer.address),
    ]);
    
    block.receipts[0].result.expectOk().expectAscii("Base2Stacks Token");
    block.receipts[1].result.expectOk().expectAscii("B2S");
    block.receipts[2].result.expectOk().expectUint(6);
    block.receipts[3].result.expectOk().expectSome().expectString("https://base2stacks.io/token.json");
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
  name: "Test transfer with memo",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const memo = "Transfer memo";
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(1000000),
        types.principal(deployer.address),
        types.principal(wallet1.address),
        types.some(types.buff(Array.from(new TextEncoder().encode(memo))))
      ], deployer.address),
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "Test invalid transfers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    let block = chain.mineBlock([
      // Transfer zero amount
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(0),
        types.principal(deployer.address),
        types.principal(wallet1.address),
        types.none()
      ], deployer.address),
      
      // Transfer more than balance
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(999999999999999999),
        types.principal(wallet1.address),
        types.principal(wallet2.address),
        types.none()
      ], wallet1.address),
      
      // Transfer from wrong sender
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(1000),
        types.principal(deployer.address),
        types.principal(wallet2.address),
        types.none()
      ], wallet1.address),
    ]);
    
    block.receipts[0].result.expectErr().expectUint(103); // err-invalid-amount
    block.receipts[1].result.expectErr().expectUint(102); // err-insufficient-balance
    block.receipts[2].result.expectErr().expectUint(101); // err-not-token-owner
  }
});

Clarinet.test({
  name: "Test total supply after minting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-total-supply', [], deployer.address),
      Tx.contractCall('b2s-token', 'mint', [
        types.uint(100000000),
        types.principal(wallet1.address)
      ], deployer.address),
      Tx.contractCall('b2s-token', 'get-total-supply', [], deployer.address),
    ]);
    
    const initialSupply = block.receipts[0].result.expectOk().expectUint(400000000000000);
    block.receipts[1].result.expectOk().expectBool(true);
    const newSupply = block.receipts[2].result.expectOk().expectUint(400000100000000);
    
    assertEquals(newSupply, initialSupply + 100000000n);
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
    assertEquals(stats['total-rewards'], types.uint(0));
    assertEquals(stats['last-claim'], types.uint(0));
  }
});

Clarinet.test({
  name: "Test tracker stats default values",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-tracker-stats', [
        types.principal(wallet1.address)
      ], wallet1.address),
    ]);
    
    const stats = block.receipts[0].result.expectTuple();
    assertEquals(stats['total-tracked'], types.uint(0));
    assertEquals(stats['total-rewards'], types.uint(0));
    assertEquals(stats['last-claim'], types.uint(0));
  }
});

Clarinet.test({
  name: "Test duplicate bridge transaction tracking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const tracker = accounts.get('wallet_1')!;
    const txHash = new Uint8Array(32).fill(42);
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'track-bridge-tx', [
        types.buff(txHash),
        types.ascii("BASE"),
        types.ascii("STACKS"),
        types.uint(1000000000)
      ], tracker.address),
      
      // Track same transaction again
      Tx.contractCall('b2s-token', 'track-bridge-tx', [
        types.buff(txHash),
        types.ascii("BASE"),
        types.ascii("STACKS"),
        types.uint(2000000000) // Different amount
      ], tracker.address),
    ]);
    
    // First tracking should succeed
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Second tracking should also succeed (overwrites in current implementation)
    block.receipts[1].result.expectOk().expectBool(true);
    
    // Check tracker stats - should only count as 1 tracked transaction
    let statsBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-tracker-stats', [
        types.principal(tracker.address)
      ], tracker.address),
    ]);
    
    const stats = statsBlock.receipts[0].result.expectTuple();
    assertEquals(stats['total-tracked'], types.uint(1)); // Still 1 because it overwrites
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
    
    // Check tracker stats updated
    let statsBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-tracker-stats', [
        types.principal(tracker.address)
      ], tracker.address),
    ]);
    
    const stats = statsBlock.receipts[0].result.expectTuple();
    assertEquals(stats['total-tracked'], types.uint(1));
    assertEquals(stats['total-rewards'], types.uint(10000000));
    assertNotEquals(stats['last-claim'], types.uint(0));
  }
});

Clarinet.test({
  name: "Test verification by non-owner fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const tracker = accounts.get('wallet_1')!;
    const attacker = accounts.get('wallet_2')!;
    const txHash = new Uint8Array(32).fill(99);
    
    // Track transaction
    let trackBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'track-bridge-tx', [
        types.buff(txHash),
        types.ascii("STACKS"),
        types.ascii("BASE"),
        types.uint(500000000)
      ], tracker.address),
    ]);
    
    // Try to verify as non-owner
    let verifyBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'verify-bridge-tx', [
        types.buff(txHash)
      ], attacker.address),
    ]);
    
    verifyBlock.receipts[0].result.expectErr().expectUint(100); // err-owner-only
    
    // Verify as owner should work
    let ownerVerifyBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'verify-bridge-tx', [
        types.buff(txHash)
      ], deployer.address),
    ]);
    
    ownerVerifyBlock.receipts[0].result.expectOk().expectBool(true);
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
  name: "Test daily claims across multiple days",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const claimer = accounts.get('wallet_1')!;
    
    // Day 1 claim
    let day1Block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'claim-daily-reward', [], claimer.address),
    ]);
    day1Block.receipts[0].result.expectOk().expectBool(true);
    
    let balanceAfterDay1 = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-balance', [
        types.principal(claimer.address)
      ], claimer.address),
    ]);
    assertEquals(balanceAfterDay1.receipts[0].result.expectOk().expectUint(5000000), 5000000n);
    
    // Try claim same day - should fail
    let sameDayBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'claim-daily-reward', [], claimer.address),
    ]);
    sameDayBlock.receipts[0].result.expectErr().expectUint(104);
    
    // Advance ~144 blocks (1 day)
    chain.mineEmptyBlock(144);
    
    // Day 2 claim
    let day2Block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'claim-daily-reward', [], claimer.address),
    ]);
    day2Block.receipts[0].result.expectOk().expectBool(true);
    
    let balanceAfterDay2 = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-balance', [
        types.principal(claimer.address)
      ], claimer.address),
    ]);
    assertEquals(balanceAfterDay2.receipts[0].result.expectOk().expectUint(10000000), 10000000n);
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
    assertNotEquals(stakedInfo['staked-at'], types.uint(0));
  }
});

Clarinet.test({
  name: "Test staking edge cases",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const staker = accounts.get('wallet_1')!;
    
    // First transfer tokens to staker
    let setupBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(100000000),
        types.principal(deployer.address),
        types.principal(staker.address),
        types.none()
      ], deployer.address),
    ]);
    
    let block = chain.mineBlock([
      // Stake zero amount
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(0)
      ], staker.address),
      
      // Stake more than balance
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(200000000)
      ], staker.address),
      
      // Valid stake
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(50000000)
      ], staker.address),
      
      // Unstake zero
      Tx.contractCall('b2s-token', 'unstake', [
        types.uint(0)
      ], staker.address),
      
      // Unstake more than staked
      Tx.contractCall('b2s-token', 'unstake', [
        types.uint(100000000)
      ], staker.address),
    ]);
    
    block.receipts[0].result.expectErr().expectUint(103); // err-invalid-amount
    block.receipts[1].result.expectErr().expectUint(102); // err-insufficient-balance
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectErr().expectUint(103); // err-invalid-amount
    block.receipts[4].result.expectErr().expectUint(102); // err-insufficient-balance
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
  name: "Test total staked updates correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const staker1 = accounts.get('wallet_1')!;
    const staker2 = accounts.get('wallet_2')!;
    
    // Transfer tokens to both stakers
    let setupBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(100000000),
        types.principal(deployer.address),
        types.principal(staker1.address),
        types.none()
      ], deployer.address),
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(100000000),
        types.principal(deployer.address),
        types.principal(staker2.address),
        types.none()
      ], deployer.address),
    ]);
    
    let block = chain.mineBlock([
      // Check initial total staked
      Tx.contractCall('b2s-token', 'get-total-staked', [], deployer.address),
      
      // Staker1 stakes 30
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(30000000)
      ], staker1.address),
      
      // Check total staked after staker1
      Tx.contractCall('b2s-token', 'get-total-staked', [], deployer.address),
      
      // Staker2 stakes 50
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(50000000)
      ], staker2.address),
      
      // Check total staked after both
      Tx.contractCall('b2s-token', 'get-total-staked', [], deployer.address),
      
      // Staker1 unstakes 10
      Tx.contractCall('b2s-token', 'unstake', [
        types.uint(10000000)
      ], staker1.address),
      
      // Check final total staked
      Tx.contractCall('b2s-token', 'get-total-staked', [], deployer.address),
    ]);
    
    assertEquals(block.receipts[0].result.expectOk().expectUint(0), 0n);
    assertEquals(block.receipts[2].result.expectOk().expectUint(30000000), 30000000n);
    assertEquals(block.receipts[4].result.expectOk().expectUint(80000000), 80000000n);
    assertEquals(block.receipts[6].result.expectOk().expectUint(70000000), 70000000n);
  }
});

Clarinet.test({
  name: "Test staked-at timestamp updates correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const staker = accounts.get('wallet_1')!;
    
    // Transfer and stake at block 1
    let block1 = chain.mineBlock([
      Tx.contractCall('b2s-token', 'transfer', [
        types.uint(100000000),
        types.principal(deployer.address),
        types.principal(staker.address),
        types.none()
      ], deployer.address),
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(50000000)
      ], staker.address),
    ]);
    
    let stakeTime1 = block1.height;
    
    // Advance chain and stake more at block 2
    chain.mineEmptyBlock(10);
    
    let block2 = chain.mineBlock([
      Tx.contractCall('b2s-token', 'stake', [
        types.uint(25000000)
      ], staker.address),
    ]);
    
    let stakeTime2 = block2.height;
    
    // Check staked info
    let infoBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-staked-balance', [
        types.principal(staker.address)
      ], staker.address),
    ]);
    
    const stakedInfo = infoBlock.receipts[0].result.expectTuple();
    assertEquals(stakedInfo['amount'], types.uint(75000000));
    assertEquals(stakedInfo['staked-at'], types.uint(stakeTime1)); // Should be first stake time
    
    // Unstake and check if staked-at remains
    let unstakeBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'unstake', [
        types.uint(25000000)
      ], staker.address),
    ]);
    
    let finalInfoBlock = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-staked-balance', [
        types.principal(staker.address)
      ], staker.address),
    ]);
    
    const finalStakedInfo = finalInfoBlock.receipts[0].result.expectTuple();
    assertEquals(finalStakedInfo['amount'], types.uint(50000000));
    assertEquals(finalStakedInfo['staked-at'], types.uint(stakeTime1));
  }
});

Clarinet.test({
  name: "Test get-total-supply",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('b2s-token', 'get-total-supply', [], deployer.address),
    ]);
    
    block.receipts[0].result.expectOk().expectUint(400000000000000);
  }
});
