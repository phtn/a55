'use client'

import type { ProductPaymentTokenOption } from '@/components/product/use-product-payment-selection'
import { Field } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PayNetworkName } from '@/lib/appkit/pay-config'
import type { Token } from '@/lib/appkit/token-coaster'
import { Icon, type IconName } from '@/lib/icons'
import { useMemo } from 'react'

interface Item {
  balanceLabel: string
  disabled: boolean
  label: string
  requiredLabel: string | null
  usdValue: number | null
  value: Token
  icon: IconName
}

const tokenIconByValue: Record<Token, IconName> = {
  bitcoin: 'btc',
  ethereum: 'eth',
  sepolia: 'eth',
  matic: 'pol',
  pol: 'pol',
  usdc: 'usdc',
  usdt: 'usdt'
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const formatUsdValue = (value: number | null) => (value == null ? '--' : CURRENCY_FORMATTER.format(value))

const getBalanceLabel = (balance: number, token: Token, network: PayNetworkName | null) => {
  const displaySymbol =
    token === 'ethereum' && (network === 'polygon' || network === 'amoy')
      ? 'POL'
      : token === 'ethereum'
        ? 'ETH'
        : token.toUpperCase()

  return `${balance.toLocaleString('en-US', {
    maximumFractionDigits: token === 'usdc' || token === 'usdt' ? 2 : 6
  })} ${displaySymbol}`
}

const getTokenItem = (
  option: ProductPaymentTokenOption,
  network: PayNetworkName | null,
  requiredUsdValue: number | null,
  exchangeRateError: string | null
): Item => {
  const { balance, isDisabled, token, usdValue } = option
  const requiredLabel = !isDisabled
    ? null
    : exchangeRateError
      ? 'FX unavailable'
      : requiredUsdValue != null && requiredUsdValue > 0
        ? `need ${CURRENCY_FORMATTER.format(requiredUsdValue - balance)}`
        : null

  if (token === 'bitcoin') {
    return {
      balanceLabel: getBalanceLabel(balance, token, network),
      disabled: isDisabled,
      label: 'Bitcoin',
      requiredLabel,
      usdValue,
      value: token,
      icon: 'btc'
    }
  }

  if (token === 'ethereum' && (network === 'polygon' || network === 'amoy')) {
    return {
      balanceLabel: getBalanceLabel(balance, token, network),
      disabled: isDisabled,
      label: 'Polygon',
      requiredLabel,
      usdValue,
      value: token,
      icon: 'pol'
    }
  }

  if (token === 'ethereum') {
    return {
      balanceLabel: getBalanceLabel(balance, token, network),
      disabled: isDisabled,
      label: 'Ethereum',
      requiredLabel,
      usdValue,
      value: token,
      icon: 'eth'
    }
  }

  if (token === 'matic' || token === 'pol') {
    return {
      balanceLabel: getBalanceLabel(balance, token, network),
      disabled: isDisabled,
      label: 'POL',
      requiredLabel,
      usdValue,
      value: token,
      icon: tokenIconByValue[token]
    }
  }

  if (token === 'sepolia') {
    return {
      balanceLabel: getBalanceLabel(balance, token, network),
      disabled: isDisabled,
      label: 'Sepolia',
      requiredLabel,
      usdValue,
      value: token,
      icon: 'eth'
    }
  }

  return {
    balanceLabel: getBalanceLabel(balance, token, network),
    disabled: isDisabled,
    label: token.toUpperCase(),
    requiredLabel,
    usdValue,
    value: token,
    icon: tokenIconByValue[token]
  }
}

interface TokenSelectProps {
  exchangeRateError?: string | null
  isLoading?: boolean
  onValueChange: (token: Token) => void
  options: ProductPaymentTokenOption[]
  requiredUsdValue: number | null
  selectedNetwork: PayNetworkName | null
  value: Token | null
}

export const TokenSelect = ({
  exchangeRateError = null,
  isLoading = false,
  onValueChange,
  options,
  requiredUsdValue,
  selectedNetwork,
  value
}: TokenSelectProps) => {
  const items = useMemo(
    () => options.map((option) => getTokenItem(option, selectedNetwork, requiredUsdValue, exchangeRateError)),
    [exchangeRateError, options, requiredUsdValue, selectedNetwork]
  )
  const selected = useMemo(() => items.find((item) => item.value === value) ?? null, [items, value])
  const hasEnabledItems = items.some((item) => !item.disabled)
  const placeholder = isLoading
    ? 'Loading tokens...'
    : !selectedNetwork
      ? 'Select network'
      : items.length === 0
        ? 'No token balance'
        : exchangeRateError
          ? 'Exchange rate unavailable'
          : hasEnabledItems
            ? 'Select token'
            : 'Insufficient balance'

  return (
    <Field id='token-select' className='max-w-xs'>
      <Select
        value={selected}
        items={items}
        disabled={isLoading || !selectedNetwork || items.length === 0}
        onValueChange={(item) => item?.value && !item.disabled && onValueChange(item.value)}>
        <SelectTrigger className='w-xs bg-background border-background rounded-md' size='lg'>
          <SelectValue placeholder={placeholder}>
            {(item: Item) => (
              <span className='flex items-center gap-2 font-display text-base w-64 justify-between'>
                <span className='flex items-center gap-2 min-w-0'>
                  <Icon name={selected ? item?.icon : 'coins'} className='size-5' />
                  <span>{item?.label ?? 'Token'}</span>
                </span>
                {item ? <span className='text-base text-foreground/80'>{formatUsdValue(item.usdValue)}</span> : null}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem
                key={item.value}
                value={item}
                disabled={item.disabled}
                className='flex items-center justify-between w-full'>
                <div className='flex items-center space-x-2 w-full'>
                  <Icon name={item.icon} className='size-5 my-auto' />
                  <div className='flex flex-col space-y-px'>
                    <span className='flex items-center font-display text-base'>{item.label}</span>
                    <span className='text-xs text-muted-foreground'>{item.balanceLabel}</span>
                  </div>
                </div>
                <div className='flex flex-col items-end justify-center'>
                  <div className='font-display text-base tracking-tight'>{formatUsdValue(item.usdValue)}</div>
                  {item.requiredLabel ? (
                    <span className='font-display text-xs text-foreground/80'>{item.requiredLabel}</span>
                  ) : null}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}
