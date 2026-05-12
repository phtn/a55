import {ConstantsUtil as CommonConstantsUtil} from '@reown/appkit-common'
import {
  AdapterBlueprint,
  CoreHelperUtil,
  WalletConnectConnector,
  type WalletGetAssetsResponse,
} from '@reown/appkit-controllers'
import {formatUnits, parseUnits} from 'viem'
import type UniversalProvider from '@walletconnect/universal-provider'

const BTC_NAMESPACE = 'bip122' as const
const BTC_SYMBOL = 'BTC'

export class BitcoinAdapter extends AdapterBlueprint {
  constructor() {
    super({
      namespace: BTC_NAMESPACE,
      adapterType: CommonConstantsUtil.ADAPTER_TYPES.BITCOIN,
    })
  }

  async setUniversalProvider(universalProvider: UniversalProvider) {
    this.addConnector(
      new WalletConnectConnector({
        provider: universalProvider,
        caipNetworks: this.getCaipNetworks(),
        namespace: BTC_NAMESPACE,
      }),
    )
  }

  async connect(params: AdapterBlueprint.ConnectParams) {
    return {
      id: CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT,
      type: CommonConstantsUtil.CONNECTOR_TYPE_WALLET_CONNECT,
      chainId: params.chainId ?? '',
      provider: this.provider,
      address: '',
    }
  }

  async disconnect() {
    try {
      const connector = this.getWalletConnectConnector()
      await connector.disconnect()
      this.emit('disconnect')
    } catch (error) {
      console.warn('BitcoinAdapter:disconnect - error', error)
    }

    return {connections: []}
  }

  async getAccounts(params: AdapterBlueprint.GetAccountsParams) {
    const walletConnectProvider = this.provider as UniversalProvider | undefined
    const resolvedNamespace = params.namespace ?? BTC_NAMESPACE
    const caipAccounts =
      walletConnectProvider?.session?.namespaces?.[resolvedNamespace]?.accounts
        ?.filter(
          (account): account is `${typeof BTC_NAMESPACE}:${string}:${string}` => {
            const [namespace, chainId, address] = account.split(':')

            return (
              namespace === BTC_NAMESPACE &&
              chainId.length > 0 &&
              address.length > 0
            )
          },
        )
        .filter(
          (account, index, allAccounts) => allAccounts.indexOf(account) === index,
        ) ?? []

    return {
      accounts: caipAccounts.map((caipAddress) =>
        CoreHelperUtil.createAccount({
          caipAddress,
          type: 'payment',
        }),
      ),
    }
  }

  async syncConnectors() {}

  async syncConnections() {}

  async syncConnection(params: AdapterBlueprint.SyncConnectionParams) {
    return {
      id: CommonConstantsUtil.CONNECTOR_ID.WALLET_CONNECT,
      type: CommonConstantsUtil.CONNECTOR_TYPE_WALLET_CONNECT,
      chainId: params.chainId ?? '',
      provider: this.provider,
      address: '',
    }
  }

  async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams) {
    const connector = this.getWalletConnectConnector()
    const provider = connector.provider as UniversalProvider | undefined
    provider?.setDefaultChain(params.caipNetwork.caipNetworkId)
    await super.switchNetwork(params)
  }

  async getBalance(params: AdapterBlueprint.GetBalanceParams) {
    return {
      balance: '0',
      symbol: params.caipNetwork?.nativeCurrency.symbol ?? BTC_SYMBOL,
    }
  }

  async signMessage(params: AdapterBlueprint.SignMessageParams) {
    const provider = params.provider as
      | {
          request: <T>(args: {
            method: string
            params?: readonly unknown[] | object
          }) => Promise<T>
        }
      | undefined

    if (!provider) {
      throw new Error('BitcoinAdapter:signMessage - provider is undefined')
    }

    const signature = await provider.request<string>({
      method: 'signMessage',
      params: {
        message: params.message,
        address: params.address,
      },
    })

    return {signature}
  }

  async estimateGas() {
    return {gas: BigInt(0)}
  }

  async sendTransaction(params: AdapterBlueprint.SendTransactionParams) {
    if (!this.provider) {
      throw new Error('BitcoinAdapter:sendTransaction - provider is undefined')
    }

    const value =
      typeof params.value === 'bigint'
        ? params.value
        : BigInt(Math.trunc(params.value))
    const requestParams = {
      recipient: params.to,
      amount: value.toString(),
    }

    const provider = this.provider as {
      request: <T>(args: {
        method: string
        params?: readonly unknown[] | object
      }) => Promise<T>
    }

    const hash = await provider.request<string>({
      method: 'sendTransfer',
      params: requestParams,
    })

    return {hash}
  }

  async writeContract() {
    return {hash: ''}
  }

  async writeSolanaTransaction() {
    return {hash: ''}
  }

  parseUnits(params: AdapterBlueprint.ParseUnitsParams) {
    return parseUnits(params.value, params.decimals)
  }

  formatUnits(params: AdapterBlueprint.FormatUnitsParams) {
    return formatUnits(params.value, params.decimals)
  }

  getWalletConnectProvider() {
    const connector = this.connectors.find(
      (candidate) =>
        candidate.type === CommonConstantsUtil.CONNECTOR_TYPE_WALLET_CONNECT,
    )

    return connector?.provider
  }

  async getCapabilities() {
    return {}
  }

  async grantPermissions() {
    return {}
  }

  async revokePermissions(params: AdapterBlueprint.RevokePermissionsParams) {
    void params
    return '0x0' as `0x${string}`
  }

  async walletGetAssets(): Promise<WalletGetAssetsResponse> {
    return {}
  }
}
