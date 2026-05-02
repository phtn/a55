export interface ETF {
  last: {
    symbol: string
    companyName: string
    cid: number
    tid: number
    latestPrice: number
    previousClose: number
    change: number
    changePercent: number
    latestUpdate: number
    latestSource: string
    fc: boolean
    ts: {
      date: string
      minute: string
      label: string
      high: number
      low: number
      open: number
      close: number
      average: number
    }[]
  }[]
}

export interface Movers {
  active: {
    symbol: string
    companyName: string
    cid: number
    tid: number
    latestPrice: number
    previousClose: number
    change: number
    changePercent: number
    latestUpdate: number
    latestSource: string
    fromProvider: {
      fullExchangeName: string
      symbol: string
      gmtOffSetMilliseconds: number
      regularMarketOpen: {
        raw: number
        fmt: string
      }
      language: string
      regularMarketTime: {
        raw: number
        fmt: string
      }
      regularMarketChangePercent: {
        raw: number
        fmt: string
      }
      quoteType: string
      typeDisp: string
      lastClosePriceToNNWCPerShare: {
        raw: number
        fmt: string
      }
      tradeable: boolean
      regularMarketPreviousClose: {
        raw: number
        fmt: string
      }
      exchangeTimezoneName: string
      regularMarketChange: {
        raw: number
        fmt: string
      }
      cryptoTradeable: boolean
      firstTradeDateMilliseconds: number
      exchangeDataDelayedBy: number
      exchangeTimezoneShortName: string
      hasPrePostMarketData: boolean
      customPriceAlertConfidence: string
      marketState: string
      regularMarketPrice: {
        raw: number
        fmt: string
      }
      regularMarketVolume: {
        raw: number
        fmt: string
        longFmt: string
      }
      market: string
      quoteSourceName: string
      lastCloseTevEbitLtm: {
        raw: number
        fmt: string
      }
      priceHint: number
      exchange: string
      sourceInterval: number
      shortName: string
      region: string
      triggerable: boolean
    }
  }[]
  gainers: {
    symbol: string
    cid: number
    tid: number
    latestPrice: number
    previousClose: number
    change: number
    changePercent: number
    latestUpdate: number
    latestSource: string
    fromProvider: {
      fullExchangeName: string
      symbol: string
      gmtOffSetMilliseconds: number
      regularMarketOpen: {
        raw: number
        fmt: string
      }
      language: string
      regularMarketTime: {
        raw: number
        fmt: string
      }
      regularMarketChangePercent: {
        raw: number
        fmt: string
      }
      quoteType: string
      typeDisp: string
      tradeable: boolean
      regularMarketPreviousClose: {
        raw: number
        fmt: string
      }
      exchangeTimezoneName: string
      regularMarketChange: {
        raw: number
        fmt: string
      }
      cryptoTradeable: boolean
      exchangeDataDelayedBy: number
      firstTradeDateMilliseconds: number
      exchangeTimezoneShortName: string
      hasPrePostMarketData: boolean
      regularMarketPrice: {
        raw: number
        fmt: string
      }
      customPriceAlertConfidence: string
      marketState: string
      market: string
      regularMarketVolume: {
        raw: number
        fmt: string
        longFmt: string
      }
      quoteSourceName: string
      priceHint: number
      exchange: string
      sourceInterval: number
      region: string
      triggerable: boolean
    }
  }[]
  losers: {
    symbol: string
    companyName: string
    cid: number
    tid: number
    latestPrice: number
    previousClose: number
    change: number
    changePercent: number
    latestUpdate: number
    latestSource: string
    fromProvider: {
      fullExchangeName: string
      symbol: string
      gmtOffSetMilliseconds: number
      regularMarketOpen: {
        raw: number
        fmt: string
      }
      language: string
      regularMarketTime: {
        raw: number
        fmt: string
      }
      regularMarketChangePercent: {
        raw: number
        fmt: string
      }
      quoteType: string
      typeDisp: string
      lastClosePriceToNNWCPerShare: {
        raw: number
        fmt: string
      }
      tradeable: boolean
      regularMarketPreviousClose: {
        raw: number
        fmt: string
      }
      exchangeTimezoneName: string
      regularMarketChange: {
        raw: number
        fmt: string
      }
      cryptoTradeable: boolean
      exchangeDataDelayedBy: number
      firstTradeDateMilliseconds: number
      exchangeTimezoneShortName: string
      hasPrePostMarketData: boolean
      marketState: string
      regularMarketPrice: {
        raw: number
        fmt: string
      }
      customPriceAlertConfidence: string
      market: string
      regularMarketVolume: {
        raw: number
        fmt: string
        longFmt: string
      }
      quoteSourceName: string
      lastCloseTevEbitLtm: {
        raw: number
        fmt: string
      }
      priceHint: number
      exchange: string
      sourceInterval: number
      shortName: string
      region: string
      triggerable: boolean
    }
  }[]
  overview: {
    symbol: string
    companyName: string
    cid: number
    tid: number
    latestPrice: number
    previousClose: number
    change: number
    changePercent: number
    latestUpdate: number
    latestSource: string
    fc: boolean
  }[]
}

export interface OverviewPayload {
  auth: string
  type: string
}

export interface LastQuotePayload {
  auth: string
  fetchType: string
  ids: {
    cid: number
    tid: number
  }[]
}

export type TikrEndpoint = 'lastquote_it' | 'overview_it' | 'headlines' | 'getsubdetails' | 'gwm' | 'luw' | 'hold'
