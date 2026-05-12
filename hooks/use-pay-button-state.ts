import type {Token} from '@/lib/appkit/token-coaster'
import {useEffect, useMemo} from 'react'

export interface UsePayButtonStateParams {
  disabled: boolean
  activeIsConfirming: boolean
  activeIsPending: boolean
  hasInsufficientBalance: boolean
  selectedToken: Token | null
  paymentAmountUsd: string
  dtest: string | null
  /** For dev debug output only */
  localIsPending?: boolean
  localIsConfirming?: boolean
  isPendingProp?: boolean
  isConfirmingProp?: boolean
}

/**
 * Computes whether the Pay button should be disabled and, in development,
 * logs condition details to the console for debugging.
 */
export function usePayButtonState(params: UsePayButtonStateParams): boolean {
  const {
    disabled,
    activeIsConfirming,
    activeIsPending,
    hasInsufficientBalance,
    selectedToken,
    paymentAmountUsd,
    dtest,
    localIsPending,
    localIsConfirming,
    isPendingProp,
    isConfirmingProp,
  } = params

  const isDisabled = useMemo(() => {
    return (
      disabled ||
      activeIsConfirming ||
      activeIsPending ||
      hasInsufficientBalance ||
      !selectedToken ||
      !paymentAmountUsd ||
      !dtest
    )
  }, [
    disabled,
    activeIsConfirming,
    activeIsPending,
    hasInsufficientBalance,
    selectedToken,
    paymentAmountUsd,
    dtest,
  ])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const conditions = {
      'disabled (prop)': disabled,
      activeIsConfirming,
      activeIsPending,
      hasInsufficientBalance,
      noSelectedToken: !selectedToken,
      noPaymentAmount: !paymentAmountUsd,
      noPaymentDestination: !dtest,
    }

    const conditionTable: Record<string, string> = {}
    for (const [key, value] of Object.entries(conditions)) {
      conditionTable[key] = value ? '❌ DISABLES BUTTON' : '✅ OK'
    }
    conditionTable['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'] =
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    conditionTable['FINAL BUTTON STATE'] = isDisabled
      ? '❌ DISABLED'
      : '✅ ENABLED'
    console.table(conditionTable)

    console.group('🔍 Pay Button Condition Details')
    console.log('Condition Values:', {
      'disabled (prop)': disabled,
      activeIsConfirming,
      activeIsPending,
      hasInsufficientBalance,
      selectedToken: selectedToken ?? 'null',
      paymentAmountUsd: paymentAmountUsd || 'empty',
      paymentDestination: dtest ?? 'null',
    })
    if (
      localIsPending !== undefined ||
      localIsConfirming !== undefined ||
      isPendingProp !== undefined ||
      isConfirmingProp !== undefined
    ) {
      console.log('Calculated States:', {
        localIsPending,
        localIsConfirming,
        'isPending (prop)': isPendingProp,
        'isConfirming (prop)': isConfirmingProp,
        activeIsPending,
        activeIsConfirming,
      })
    }
    console.log('Final Result:', {
      isDisabled,
      buttonWillBe: isDisabled ? 'DISABLED' : 'ENABLED',
    })
    console.groupEnd()
  }, [
    disabled,
    activeIsConfirming,
    activeIsPending,
    hasInsufficientBalance,
    selectedToken,
    paymentAmountUsd,
    dtest,
    isDisabled,
    localIsPending,
    localIsConfirming,
    isPendingProp,
    isConfirmingProp,
  ])

  return isDisabled
}
