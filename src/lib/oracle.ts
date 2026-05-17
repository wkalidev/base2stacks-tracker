/**
 * OracleClient — b2s-price-oracle
 * Compatible with @stacks/transactions v7+
 */

import { fetchCallReadOnlyFunction, cvToValue, stringAsciiCV } from '@stacks/transactions'
import { STACKS_MAINNET } from '@stacks/network'
import { B2S_CONTRACT_ADDRESS } from './token'

export const ORACLE_CONTRACT_NAME = 'b2s-price-oracle'

export class OracleClient {
  private network = STACKS_MAINNET

  async getPrice(pair = 'STX-USD') {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: B2S_CONTRACT_ADDRESS,
      contractName:    ORACLE_CONTRACT_NAME,
      functionName:    'get-price',
      functionArgs:    [stringAsciiCV(pair)],
      network:         this.network,
      senderAddress:   B2S_CONTRACT_ADDRESS,
    })
    const raw = cvToValue(result) as { price: bigint; decimals: bigint; block: bigint }
    return {
      pair,
      price:           Number(raw.price) / 1e6,
      decimals:        Number(raw.decimals),
      lastUpdateBlock: Number(raw.block),
    }
  }
}