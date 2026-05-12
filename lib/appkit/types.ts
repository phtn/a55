import {IconName} from '@/lib/icons'
import {Dispatch, Ref, SetStateAction} from 'react'
import type {PayNetworkName} from './pay-config'

export interface Balance {
  value: bigint
  symbol: string
  decimals: number
}

export type ReceiptStatus = {
  blockNumber: bigint
  status: 'success' | 'reverted'
} | null

export interface PaymentSuccessContext {
  asset: string
  chain: string
  nativeValue: number
  usdValue: number
}

export interface PayTabProps {
  onSend?: VoidFunction
  onPaymentSuccess?: (
    transactionHash: `0x${string}`,
    context?: PaymentSuccessContext,
  ) => void | Promise<void>
  formattedBalance: string | null
  balance: Balance | null
  tokenPrice: number | null
  disabled: boolean
  amountInputRef: Ref<HTMLInputElement>
  addressInputRef: Ref<HTMLInputElement>
  setTo?: Dispatch<SetStateAction<string>>
  setAmount: Dispatch<SetStateAction<string>>
  amount: string
  /** Default USD amount when no paymentAmountUsd in URL (e.g. order total for order payment flow). */
  defaultPaymentAmountUsd?: string
  defaultRelayAmountUsd?: number
  isPending?: boolean
  isConfirming?: boolean
  receipt?: ReceiptStatus
  hash?: `0x${string}` | null
  explorerUrl?: string | null
  onReset?: VoidFunction
  allowedNetworks?: readonly PayNetworkName[]
}

export interface TokenData {
  name: string
  color: string
  icon: IconName
}
