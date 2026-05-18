'use client'

import { api } from '@/convex/_generated/api'
import { JsonViewer } from '@/components/data/json-viewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  cloneCryptoWalletSettingsBundle,
  CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER,
  CRYPTO_WALLET_ADDRESSES_IDENTIFIER,
  CRYPTO_WALLET_DESTINATION_IDENTIFIER,
  CRYPTO_WALLET_NETWORK_KEYS,
  EVM_RELAY_NETWORK_KEYS,
  type BitcoinRelayCredentialsEntry,
  type CryptoWalletAddressEntry,
  type CryptoWalletAddressesSetting,
  type CryptoWalletDestinationSetting,
  type CryptoWalletNetworkKey,
  type CryptoWalletSettingsBundle,
  type EvmRelayCredentialsEntry,
  type EvmRelayNetworkKey
} from '@/lib/admin/crypto-wallet-settings'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { useMutation, useQuery } from 'convex/react'
import { useMemo, useState } from 'react'

type ToggleItem = {
  label: string
  value: 'enabled' | 'disabled'
}

const toggleItems: ToggleItem[] = [
  { label: 'Enabled', value: 'enabled' },
  { label: 'Disabled', value: 'disabled' }
]

const sectionTitleByNetwork: Record<CryptoWalletNetworkKey, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  sepolia: 'Sepolia',
  amoy: 'Amoy'
}

const createBundleFromSettings = (settings: CryptoWalletSettingsBundle): CryptoWalletSettingsBundle =>
  cloneCryptoWalletSettingsBundle(settings)

interface CryptoWalletSettingsQuery {
  privateCredentials: CryptoWalletSettingsBundle['privateCredentials']
  updatedAtByIdentifier: {
    crypto_private_credentials: number | null
    crypto_wallet_addresses: number | null
    crypto_wallet_destination: number | null
  }
  walletAddresses: CryptoWalletAddressesSetting
  walletDestination: CryptoWalletDestinationSetting
}

const formatUpdatedAt = (value: number | null | undefined) => {
  if (!value) return 'Not saved yet'
  return new Date(value).toLocaleString()
}

const normalizeSecretValue = (value: string) => value.trim()

const getPersistedSecretStatus = (persistedValue: string) => {
  const normalized = normalizeSecretValue(persistedValue)
  return normalized ? `Saved in Convex (${normalized.length} chars)` : 'No saved value in Convex'
}

const BooleanSelect = ({
  onChange,
  value
}: {
  onChange: (value: boolean) => void
  value: boolean
}) => {
  const selected = toggleItems.find((item) => (value ? 'enabled' : 'disabled') === item.value) ?? toggleItems[0]

  return (
    <Select value={selected} items={toggleItems} onValueChange={(item) => item && onChange(item.value === 'enabled')}>
      <SelectTrigger className='w-full rounded-md'>
        <SelectValue>
          {(item: ToggleItem) => <span>{item.label}</span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {toggleItems.map((item) => (
            <SelectItem key={item.value} value={item}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const IdentifierPill = ({ identifier }: { identifier: string }) => (
  <div className='rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground'>{identifier}</div>
)

const WalletAddressSection = ({
  networkKey,
  onChange,
  value
}: {
  networkKey: CryptoWalletNetworkKey
  onChange: (value: CryptoWalletAddressEntry) => void
  value: CryptoWalletAddressEntry
}) => (
  <div className='rounded-xl border border-border/60 bg-background/60 p-4'>
    <div className='mb-4 flex items-center justify-between gap-3'>
      <div>
        <p className='font-display text-base font-medium tracking-tight'>{sectionTitleByNetwork[networkKey]}</p>
        <p className='text-sm text-muted-foreground'>Store the payment address and whether this network is offered.</p>
      </div>
    </div>

    <div className='grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]'>
      <Field>
        <FieldLabel htmlFor={`wallet-address-${networkKey}`}>Address</FieldLabel>
        <Input
          id={`wallet-address-${networkKey}`}
          className='rounded-md'
          placeholder={`${sectionTitleByNetwork[networkKey]} address`}
          value={value.address}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`wallet-active-${networkKey}`}>Availability</FieldLabel>
        <BooleanSelect value={value.active} onChange={(active) => onChange({ ...value, active })} />
      </Field>
    </div>
  </div>
)

const RelayDestinationSection = ({
  networkKey,
  onChange,
  value
}: {
  networkKey: CryptoWalletNetworkKey
  onChange: (value: string) => void
  value: string
}) => (
  <div className='rounded-xl border border-border/60 bg-background/60 p-4'>
    <p className='mb-4 font-display text-base font-medium tracking-tight'>{sectionTitleByNetwork[networkKey]}</p>
    <Field>
      <FieldLabel htmlFor={`wallet-destination-${networkKey}`}>Destination address</FieldLabel>
      <Input
        id={`wallet-destination-${networkKey}`}
        className='rounded-md'
        placeholder={`${sectionTitleByNetwork[networkKey]} relay destination`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  </div>
)

const EvmCredentialsSection = ({
  networkKey,
  onChange,
  persistedPrivateValue,
  value
}: {
  networkKey: EvmRelayNetworkKey
  onChange: (value: EvmRelayCredentialsEntry) => void
  persistedPrivateValue: string
  value: EvmRelayCredentialsEntry
}) => {
  const hasUnsavedPrivateKeyChange = normalizeSecretValue(value.evmPrivate) !== normalizeSecretValue(persistedPrivateValue)

  return (
    <div className='rounded-xl border border-border/60 bg-background/60 p-4'>
      <div className='mb-4 flex items-start justify-between gap-3'>
      <div>
        <p className='font-display text-base font-medium tracking-tight'>{sectionTitleByNetwork[networkKey]}</p>
        <p className='text-sm text-muted-foreground'>Canonical EVM relay fields saved as `evmNative` and `evmPrivate`.</p>
        <p className='mt-1 text-xs text-muted-foreground'>
          {getPersistedSecretStatus(persistedPrivateValue)}
          {hasUnsavedPrivateKeyChange ? ' • Unsaved private-key change' : ''}
        </p>
      </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Field>
          <FieldLabel htmlFor={`credential-enabled-${networkKey}`}>Relay status</FieldLabel>
          <BooleanSelect value={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`credential-native-${networkKey}`}>Source address</FieldLabel>
          <Input
            id={`credential-native-${networkKey}`}
            className='rounded-md'
            placeholder={`${sectionTitleByNetwork[networkKey]} source address`}
            value={value.evmNative}
            onChange={(event) => onChange({ ...value, evmNative: event.target.value })}
          />
        </Field>

        <Field className='md:col-span-2'>
          <FieldLabel htmlFor={`credential-private-${networkKey}`}>Private key</FieldLabel>
          <Input
            id={`credential-private-${networkKey}`}
            autoComplete='off'
            className='rounded-md font-mono'
            placeholder={`${sectionTitleByNetwork[networkKey]} private key`}
            value={value.evmPrivate}
            onChange={(event) => onChange({ ...value, evmPrivate: event.target.value })}
          />
        </Field>
      </div>
    </div>
  )
}

const BitcoinCredentialsSection = ({
  onChange,
  persistedPrivateValue,
  value
}: {
  onChange: (value: BitcoinRelayCredentialsEntry) => void
  persistedPrivateValue: string
  value: BitcoinRelayCredentialsEntry
}) => {
  const hasUnsavedPrivateKeyChange = normalizeSecretValue(value.btcPrivate) !== normalizeSecretValue(persistedPrivateValue)

  return (
    <div className='rounded-xl border border-border/60 bg-background/60 p-4'>
      <div className='mb-4'>
        <p className='font-display text-base font-medium tracking-tight'>Bitcoin</p>
        <p className='text-sm text-muted-foreground'>
          Canonical Bitcoin relay fields saved as `btcApiUrl`, `btcNative`, and `btcPrivate`.
        </p>
        <p className='mt-1 text-xs text-muted-foreground'>
          {getPersistedSecretStatus(persistedPrivateValue)}
          {hasUnsavedPrivateKeyChange ? ' • Unsaved private-key change' : ''}
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Field>
          <FieldLabel htmlFor='credential-enabled-bitcoin'>Relay status</FieldLabel>
          <BooleanSelect value={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} />
        </Field>

        <Field>
          <FieldLabel htmlFor='credential-api-bitcoin'>Mempool API URL</FieldLabel>
          <Input
            id='credential-api-bitcoin'
            className='rounded-md'
            placeholder='https://mempool.space/api'
            value={value.btcApiUrl}
            onChange={(event) => onChange({ ...value, btcApiUrl: event.target.value })}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='credential-native-bitcoin'>Source address</FieldLabel>
          <Input
            id='credential-native-bitcoin'
            className='rounded-md'
            placeholder='bc1...'
            value={value.btcNative}
            onChange={(event) => onChange({ ...value, btcNative: event.target.value })}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='credential-private-bitcoin'>WIF / private key</FieldLabel>
          <Input
            id='credential-private-bitcoin'
            autoComplete='off'
            className='rounded-md font-mono'
            placeholder='Bitcoin WIF or private key'
            value={value.btcPrivate}
            onChange={(event) => onChange({ ...value, btcPrivate: event.target.value })}
          />
        </Field>
      </div>
    </div>
  )
}

export const CryptoWallets = () => {
  const { hasAdminClaim, isLoading } = useFirebaseUser()
  const settings = useQuery(api.admin.q.getCryptoWalletSettings, !isLoading && hasAdminClaim ? {} : 'skip')

  if (isLoading || !hasAdminClaim) {
    return (
      <Card className='rounded-2xl ring-border/50'>
        <CardHeader>
          <CardTitle>Crypto Wallet Admin Settings</CardTitle>
          <CardDescription>Securing the admin session for Convex on this subdomain.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card className='rounded-2xl ring-border/50'>
        <CardHeader>
          <CardTitle>Crypto Wallet Admin Settings</CardTitle>
          <CardDescription>Loading the current admin rows from Convex.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const settingsVersion = [
    settings.updatedAtByIdentifier.crypto_wallet_addresses ?? 'na',
    settings.updatedAtByIdentifier.crypto_wallet_destination ?? 'na',
    settings.updatedAtByIdentifier.crypto_private_credentials ?? 'na'
  ].join(':')

  return <CryptoWalletsEditor key={settingsVersion} settings={settings} />
}

const CryptoWalletsEditor = ({ settings }: { settings: CryptoWalletSettingsQuery }) => {
  const saveSettings = useMutation(api.admin.q.upsertCryptoWalletSettings)
  const [form, setForm] = useState<CryptoWalletSettingsBundle>(() =>
    createBundleFromSettings({
      privateCredentials: settings.privateCredentials,
      walletAddresses: settings.walletAddresses,
      walletDestination: settings.walletDestination
    })
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'error' | 'success' | null>(null)

  const updatedAtByIdentifier = settings?.updatedAtByIdentifier
  const persistedPrivateCredentials = settings.privateCredentials

  const handleWalletAddressChange = (networkKey: CryptoWalletNetworkKey, value: CryptoWalletAddressEntry) => {
    setForm((current) => ({
      ...current,
      walletAddresses: {
        ...current.walletAddresses,
        [networkKey]: value
      }
    }))
    setIsDirty(true)
  }

  const handleWalletDestinationChange = (networkKey: CryptoWalletNetworkKey, value: string) => {
    setForm((current) => ({
      ...current,
      walletDestination: {
        ...current.walletDestination,
        [networkKey]: value
      }
    }))
    setIsDirty(true)
  }

  const handleEvmCredentialChange = (networkKey: EvmRelayNetworkKey, value: EvmRelayCredentialsEntry) => {
    setForm((current) => ({
      ...current,
      privateCredentials: {
        ...current.privateCredentials,
        [networkKey]: value
      }
    }))
    setIsDirty(true)
  }

  const handleBitcoinCredentialChange = (value: BitcoinRelayCredentialsEntry) => {
    setForm((current) => ({
      ...current,
      privateCredentials: {
        ...current.privateCredentials,
        bitcoin: value
      }
    }))
    setIsDirty(true)
  }

  const handlePrivateCredentialsRootChange = (value: boolean) => {
    setForm((current) => ({
      ...current,
      privateCredentials: {
        ...current.privateCredentials,
        enabled: value
      }
    }))
    setIsDirty(true)
  }

  const previewData = useMemo(
    () => ({
      [CRYPTO_WALLET_ADDRESSES_IDENTIFIER]: form.walletAddresses,
      [CRYPTO_WALLET_DESTINATION_IDENTIFIER]: form.walletDestination,
      [CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER]: form.privateCredentials
    }),
    [form]
  )

  const handleSave = async () => {
    setIsSaving(true)
    setStatusMessage(null)
    setStatusTone(null)

    try {
      await saveSettings({
        privateCredentials: form.privateCredentials,
        walletAddresses: form.walletAddresses,
        walletDestination: form.walletDestination
      })

      setIsDirty(false)
      setStatusTone('success')
      setStatusMessage('Crypto wallet settings saved. The persisted-status lines under each private-key field reflect what Convex has stored.')
    } catch (error) {
      setStatusTone('error')
      setStatusMessage(error instanceof Error ? error.message : 'Unable to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='space-y-6'>
      <Card className='rounded-2xl ring-border/50'>
        <CardHeader>
          <CardTitle>Crypto Wallet Admin Settings</CardTitle>
          <CardDescription>
            Manage the admin rows used for checkout network availability, relay destinations, and relay credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <FieldGroup className='gap-4'>
            <Field>
              <FieldTitle>Stored rows</FieldTitle>
              <FieldDescription>
                These sections write directly to the `admin` table using canonical JSON payloads that the relay routes now
                read correctly.
              </FieldDescription>
            </Field>

            <div className='flex flex-wrap gap-2'>
              <IdentifierPill identifier={CRYPTO_WALLET_ADDRESSES_IDENTIFIER} />
              <IdentifierPill identifier={CRYPTO_WALLET_DESTINATION_IDENTIFIER} />
              <IdentifierPill identifier={CRYPTO_PRIVATE_CREDENTIALS_IDENTIFIER} />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className='rounded-2xl ring-border/50'>
        <CardHeader>
          <CardTitle>Checkout Wallet Addresses</CardTitle>
          <CardDescription>
            Controls the `crypto_wallet_addresses` row used to determine which payment networks are visible.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {CRYPTO_WALLET_NETWORK_KEYS.map((networkKey) => (
            <WalletAddressSection
              key={networkKey}
              networkKey={networkKey}
              value={form.walletAddresses[networkKey]}
              onChange={(value) => handleWalletAddressChange(networkKey, value)}
            />
          ))}
          <JsonViewer data={form.walletAddresses} maxHeight='max-h-80' withToolbar />
        </CardContent>
        <CardFooter className='border-t text-xs text-muted-foreground'>
          Last saved: {formatUpdatedAt(updatedAtByIdentifier.crypto_wallet_addresses)}
        </CardFooter>
      </Card>

      <Card className='rounded-2xl ring-border/50'>
        <CardHeader>
          <CardTitle>Relay Destinations</CardTitle>
          <CardDescription>
            Controls the `crypto_wallet_destination` row used by the relay API to forward settled funds.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {CRYPTO_WALLET_NETWORK_KEYS.map((networkKey) => (
            <RelayDestinationSection
              key={networkKey}
              networkKey={networkKey}
              value={form.walletDestination[networkKey]}
              onChange={(value) => handleWalletDestinationChange(networkKey, value)}
            />
          ))}
          <JsonViewer data={form.walletDestination} maxHeight='max-h-80' withToolbar />
        </CardContent>
        <CardFooter className='border-t text-xs text-muted-foreground'>
          Last saved: {formatUpdatedAt(updatedAtByIdentifier.crypto_wallet_destination)}
        </CardFooter>
      </Card>

      <Card className='rounded-2xl ring-border/50'>
        <CardHeader>
          <CardTitle>Relay Credentials</CardTitle>
          <CardDescription>
            Controls the `crypto_private_credentials` row. These values include relay source addresses and private
            credentials for EVM and Bitcoin forwarding.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-xl border border-border/60 bg-background/60 p-4'>
            <Field className='max-w-xs'>
              <FieldLabel htmlFor='credential-root-enabled'>Global relay status</FieldLabel>
              <BooleanSelect value={form.privateCredentials.enabled} onChange={handlePrivateCredentialsRootChange} />
              <FieldDescription>
                Network-level `enabled` flags override this root value. Leaving a network blank still keeps the saved
                structure stable.
              </FieldDescription>
            </Field>
          </div>

          {EVM_RELAY_NETWORK_KEYS.map((networkKey) => (
            <EvmCredentialsSection
              key={networkKey}
              networkKey={networkKey}
              persistedPrivateValue={persistedPrivateCredentials[networkKey].evmPrivate}
              value={form.privateCredentials[networkKey]}
              onChange={(value) => handleEvmCredentialChange(networkKey, value)}
            />
          ))}

          <BitcoinCredentialsSection
            persistedPrivateValue={persistedPrivateCredentials.bitcoin.btcPrivate}
            value={form.privateCredentials.bitcoin}
            onChange={handleBitcoinCredentialChange}
          />

          <JsonViewer data={form.privateCredentials} maxHeight='max-h-96' withToolbar />
        </CardContent>
        <CardFooter className='border-t text-xs text-muted-foreground'>
          Last saved: {formatUpdatedAt(updatedAtByIdentifier.crypto_private_credentials)}
        </CardFooter>
      </Card>

      <Card className='rounded-2xl ring-border/50'>
        <CardHeader>
          <CardTitle>Save Changes</CardTitle>
          <CardDescription>Review the combined payload preview, then persist all three rows in one transaction.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <JsonViewer data={previewData} maxHeight='max-h-[32rem]' withToolbar />
          {statusMessage ? (
            <div
              className={
                statusTone === 'error'
                  ? 'rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'
                  : 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300'
              }>
              {statusMessage}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className='border-t'>
          <Button disabled={isSaving || !isDirty} onClick={handleSave}>
            {isSaving ? 'Saving...' : 'Save Crypto Wallet Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
