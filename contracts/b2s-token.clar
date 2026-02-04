;; Base2Stacks Bridge Tracker Token ($B2S)
;; A fungible token for tracking cross-chain bridge activity

;; Token Definition
(define-fungible-token b2s-token u1000000000000000) ;; 1 billion tokens with 6 decimals

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-insufficient-balance (err u102))
(define-constant err-invalid-amount (err u103))
(define-constant err-already-claimed (err u104))

;; Data Variables
(define-data-var token-name (string-ascii 32) "Base2Stacks Token")
(define-data-var token-symbol (string-ascii 10) "B2S")
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://base2stacks.io/token.json"))

;; Bridge Tracking Data
(define-map bridge-transactions
  { tx-hash: (buff 32) }
  {
    tracker: principal,
    from-chain: (string-ascii 10),
    to-chain: (string-ascii 10),
    amount: uint,
    timestamp: uint,
    verified: bool
  }
)

;; Tracker Rewards
(define-map tracker-stats
  { tracker: principal }
  {
    total-tracked: uint,
    total-rewards: uint,
    last-claim: uint
  }
)

;; Daily claim tracking
(define-map daily-claims
  { tracker: principal, day: uint }
  { claimed: bool }
)

;; Staking Data
(define-map staked-balances
  { staker: principal }
  { amount: uint, staked-at: uint }
)

(define-data-var total-staked uint u0)

;; Read-Only Functions

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance b2s-token account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply b2s-token))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

(define-read-only (get-tracker-stats (tracker principal))
  (default-to
    { total-tracked: u0, total-rewards: u0, last-claim: u0 }
    (map-get? tracker-stats { tracker: tracker })
  )
)

(define-read-only (get-staked-balance (staker principal))
  (default-to
    { amount: u0, staked-at: u0 }
    (map-get? staked-balances { staker: staker })
  )
)

(define-read-only (get-total-staked)
  (ok (var-get total-staked))
)

;; Public Functions

;; Transfer tokens
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (asserts! (> amount u0) err-invalid-amount)
    (try! (ft-transfer? b2s-token amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

;; Mint initial supply (contract owner only)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ft-mint? b2s-token amount recipient)
  )
)

;; Submit bridge transaction for tracking
(define-public (track-bridge-tx 
  (tx-hash (buff 32))
  (from-chain (string-ascii 10))
  (to-chain (string-ascii 10))
  (amount uint))
  (let
    (
      (tracker tx-sender)
      (current-stats (get-tracker-stats tracker))
    )
    ;; Record transaction
    (map-set bridge-transactions
      { tx-hash: tx-hash }
      {
        tracker: tracker,
        from-chain: from-chain,
        to-chain: to-chain,
        amount: amount,
        timestamp: block-height,
        verified: false
      }
    )
    
    ;; Update tracker stats
    (map-set tracker-stats
      { tracker: tracker }
      {
        total-tracked: (+ (get total-tracked current-stats) u1),
        total-rewards: (get total-rewards current-stats),
        last-claim: (get last-claim current-stats)
      }
    )
    
    (ok true)
  )
)

;; Verify bridge transaction (contract owner only)
(define-public (verify-bridge-tx (tx-hash (buff 32)))
  (let
    (
      (tx-data (unwrap! (map-get? bridge-transactions { tx-hash: tx-hash }) (err u404)))
      (tracker (get tracker tx-data))
      (reward-amount u10000000) ;; 10 $B2S per verified transaction
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    ;; Update verification status
    (map-set bridge-transactions
      { tx-hash: tx-hash }
      (merge tx-data { verified: true })
    )
    
    ;; Mint reward to tracker
    (try! (ft-mint? b2s-token reward-amount tracker))
    
    ;; Update tracker rewards
    (let
      ((current-stats (get-tracker-stats tracker)))
      (map-set tracker-stats
        { tracker: tracker }
        {
          total-tracked: (get total-tracked current-stats),
          total-rewards: (+ (get total-rewards current-stats) reward-amount),
          last-claim: block-height
        }
      )
    )
    
    (ok true)
  )
)

;; Claim daily rewards
(define-public (claim-daily-reward)
  (let
    (
      (claimer tx-sender)
      (current-day (/ block-height u144)) ;; ~144 blocks per day
      (reward-amount u5000000) ;; 5 $B2S daily
    )
    ;; Check if already claimed today
    (asserts! 
      (is-none (map-get? daily-claims { tracker: claimer, day: current-day }))
      err-already-claimed
    )
    
    ;; Mark as claimed
    (map-set daily-claims
      { tracker: claimer, day: current-day }
      { claimed: true }
    )
    
    ;; Mint reward
    (try! (ft-mint? b2s-token reward-amount claimer))
    
    (ok true)
  )
)

;; Stake tokens
(define-public (stake (amount uint))
  (let
    (
      (staker tx-sender)
      (current-balance (ft-get-balance b2s-token staker))
      (current-stake (get-staked-balance staker))
    )
    (asserts! (>= current-balance amount) err-insufficient-balance)
    (asserts! (> amount u0) err-invalid-amount)
    
    ;; Transfer tokens to contract
    (try! (ft-transfer? b2s-token amount staker (as-contract tx-sender)))
    
    ;; Update staked balance
    (map-set staked-balances
      { staker: staker }
      {
        amount: (+ (get amount current-stake) amount),
        staked-at: block-height
      }
    )
    
    ;; Update total staked
    (var-set total-staked (+ (var-get total-staked) amount))
    
    (ok true)
  )
)

;; Unstake tokens
(define-public (unstake (amount uint))
  (let
    (
      (staker tx-sender)
      (current-stake (get-staked-balance staker))
      (staked-amount (get amount current-stake))
    )
    (asserts! (>= staked-amount amount) err-insufficient-balance)
    (asserts! (> amount u0) err-invalid-amount)
    
    ;; Transfer tokens back to staker
    (try! (as-contract (ft-transfer? b2s-token amount tx-sender staker)))
    
    ;; Update staked balance
    (map-set staked-balances
      { staker: staker }
      {
        amount: (- staked-amount amount),
        staked-at: (get staked-at current-stake)
      }
    )
    
    ;; Update total staked
    (var-set total-staked (- (var-get total-staked) amount))
    
    (ok true)
  )
)

;; Initialize contract (mint initial supply to owner)
(begin
  (try! (ft-mint? b2s-token u400000000000000 contract-owner)) ;; 400M to owner
)
