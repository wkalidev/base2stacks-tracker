import { 
  fetchCallReadOnlyFunction, 
  cvToValue, 
  uintCV, 
  principalCV, 
  stringAsciiCV, 
  makeContractCall, 
  broadcastTransaction, 
  PostConditionMode 
} from "@stacks/transactions"
import { STACKS_MAINNET } from "@stacks/network"
import type { TxOptions } from "./token"

export const FEE_ROUTER_CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N.b2s-fee-router'

export class FeeRouterClient {
  private network = STACKS_MAINNET
  private contractAddress = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'
  private contractName = 'b2s-fee-router'

  async getTotalFeesCollected() {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'get-total-fees-collected',
      functionArgs: [],
      network: this.network,
      senderAddress: this.contractAddress,
    })
    return BigInt(cvToValue(result) ?? 0)
  }

  async recordBridgeTx(
    sender: string,
    recipient: string,
    amount: bigint,
    fromChain: string,
    opts: TxOptions
  ) {
    const tx = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'record-bridge-tx',
      functionArgs: [
        principalCV(sender),
        principalCV(recipient),
        uintCV(amount),
        stringAsciiCV(fromChain),
      ],
      senderKey: opts.senderKey,
      network: this.network,
      // anchorMode supprimé — retiré dans @stacks/transactions v7+
      postConditionMode: PostConditionMode.Allow,
      fee: opts.fee ?? 2000n,
    })
    await broadcastTransaction({ transaction: tx, network: this.network }) // network retiré — plus accepté en 2e argument
    return tx
  }
}