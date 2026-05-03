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

export type QueryResponse = {
  hits: {
    companyname: string
    companystatustypeid: number
    companytypeid: number
    simpleindustryid: number
    simpleindustrydescription: string
    yearfounded: number
    webpage: string
    reportingtemplatetypeid: number
    countryid: number
    businessdescription: string
    vwap: number
    close: number
    priceclose: number
    rawStdVol: number
    rawMarketCap: number
    rawTev: number
    rawSharesOutstanding: number
    marketCap1: number
    marketCap2: number
    marketCap3: number
    stdVol1: number
    stdVol2: number
    stdVol3: number
    stdVol4: number
    tikrSymbol: string
    tikrExchangeSymbol: string
    companyid: number
    tickersymbol: string
    tradingitemid: number
    tradingitemstatusid: number
    securityid: number
    primaryflag: number
    usprimaryflag: number
    usprimaryexchange: boolean
    securitysubtypeid: number
    currencyname: string
    isocode: string
    exchangeid: number
    exchangename: string
    exchangesymbol: string
    exchangecurrencyid: number
    exchangecountryid: number
    primarytickersymbol: string
    primarytradingitemid: number
    primaryexchangecountryid: number
    primaryexchangesymbol: string
    companyLogo: string
    skPattern: string
    created: {
      epoch: number
      date: string
    }
    updated: {
      epoch: number
      date: string
    }
    primaryTrId: string
    primaryTrOaId: string
    quoteTrId: string
    quoteTrOaId: string
    quoteiexId: string
    quoteAvId: string
    _distinctSeqID: number
    objectID: string
    _highlightResult: {
      companyname: {
        value: string
        matchLevel: string
        matchedWords: unknown[]
      }
      tickersymbol: {
        value: string
        matchLevel: string
        fullyHighlighted: boolean
        matchedWords: string[]
      }
    }
  }[]
  nbHits: number
  page: number
  nbPages: number
  hitsPerPage: number
  exhaustiveNbHits: boolean
  exhaustiveTypo: boolean
  exhaustive: {
    nbHits: boolean
    typo: boolean
  }
  query: string
  params: string
  index: string
  processingTimeMS: number
  processingTimingsMS: {
    _request: {
      queue: number
      roundTrip: number
    }
    fetch: {
      total: number
    }
    total: number
  }
  serverTimeMS: number
}[]

export interface StockPriceResponse {
  numPrice: number
  isoCode: string
  price: {
    a: string
    c: string
    h: string
    l: string
    m: string
    o: string
    d: string
    v: string
    pc: string
    mc: string
    tev: string
    dap: string
    tr: string
  }[]
  company: {
    pricingdate: string
    marketcap: string
    tev: string
    sharesoutstanding: string
    tickersymbol: string
    exchangeid: number
    currencyid: number
    currencyname: string
    countryid: number
    isocode: string
    priceclose: string
  }[]
  fin: {
    dataitemname: string
    datacollectiontypeid: number
    financialcollectionid: number
    dataitemid: number
    dataitemvalue: string
    unittypeid: number
    nmflag: number
    pacvertofeedpop: number
    formtype: string
    financialperiodid: number
    calendaryear: number
    calendarquarter: number
    fiscalyear: number
    fiscalquarter: number
  }[]
  last: {
    a: string
    c: string
    h: string
    l: string
    m: string
    o: string
    d: string
    v: string
    pc: string
    mc: string
    tev: string
    dap: string
    tr: string
    iso: string
  }
}

export interface SigDevsResponse {
  data: {
    Xrefs: {
      RepNo: string
      DevelopmentId: number
      Name: string
      Ticker: string
      RIC: string
      Country: string
    }
    Dates: {
      Source: string
      Initiation: string
      LastUpdate: string
    }
    Flags: {
      FrontPage: boolean
      Significance: number
    }
    Topics: {
      Topic1: {
        Code: string
        Value: string
      }
    }
    Headline: string
    Description: string
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

export interface StockPricePayload {
  auth: string
  tid: number
  cid: number
  currency: number // default: 160
  v: string // default: v1
}

export type QueryPayload = {
  indexName: 'tikr-terminal-v1'
  query: string
  userToken: '69693219-e580-483a-9148-d0e606bf5169'
}[]

export interface SigDevsPayload {
  id: string // TICKER.0
  auth: string
}

export type TikrEndpoint =
  | 'lastquote_it'
  | 'overview_it'
  | 'headlines'
  | 'getsubdetails'
  | 'gwm'
  | 'luw'
  | 'hold'
  | 'price'
  | 'listReports'
