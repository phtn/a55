# `yf2` Usage

This directory exposes a small Yahoo Finance service layer in [index.ts](./index.ts) and a route handler at [`/api/yf2`](/Users/xpriori/Code/ftsb/app/api/yf2/route.ts:1).

## Endpoint

- `GET /api/yf2`
- `POST /api/yf2`

The route runs on the Node.js runtime, returns JSON, and sends `Cache-Control: no-store`.

## Default Behavior

If you call `GET /api/yf2` with only a `symbol`, the route defaults to the `quote` operation.

Example:

```txt
/api/yf2?symbol=TSLA
```

Response shape:

```json
{
  "operation": "quote",
  "data": {
    "symbol": "TSLA"
  }
}
```

## Supported Operations

- `quote`
- `search`
- `historical`
- `fundamentalsTimeSeries`
- `chart`
- `recommendationsBySymbol`
- `quoteSummary`
- `trendingSymbols`
- `screener`
- `insights`
- `options`

## GET Requests

Use query params for simple requests:

```txt
/api/yf2?operation=search&query=tesla
/api/yf2?operation=quoteSummary&symbol=TSLA&modules=price,summaryDetail
/api/yf2?operation=quote&symbols=AAPL,MSFT,TSLA
```

### GET Parameter Rules

- `operation`: optional, defaults to `quote`
- `symbol`: single ticker-style symbol
- `symbols`: comma-separated list for operations that support multiple symbols
- `query`: used by search-like operations
- any other query params are treated as `options`

### GET Option Parsing

These option values are parsed automatically:

- arrays: `fields`, `modules`
- booleans: `formatted`, `includePrePost`, `useYfid`, `merge`, `padTimeSeries`
- numbers: `count`, `newsCount`, `quotesCount`, `reportsCount`, `start`

You can also pass an `options` query param as a JSON object:

```txt
/api/yf2?operation=chart&symbol=TSLA&options={"period1":"2024-01-01","interval":"1d"}
```

For GET, `fundamentalsTimeSeries` should use `statementModule` in the query string so it does not clash with `operation`:

```txt
/api/yf2?operation=fundamentalsTimeSeries&symbol=AAPL&period1=2024-01-01&statementModule=financials
```

This maps to `options.module = "financials"`.

## POST Requests

Use `POST` when the request body is easier to express as JSON.

Example:

```json
{
  "operation": "chart",
  "symbol": "TSLA",
  "options": {
    "period1": "2024-01-01",
    "interval": "1d"
  }
}
```

Another example:

```json
{
  "operation": "quoteSummary",
  "symbol": "TSLA",
  "options": {
    "modules": ["price", "summaryDetail"]
  }
}
```

## Per-Operation Notes

### `quote`

- accepts `symbol` or `symbols`
- missing quote data returns `404`

Examples:

```txt
/api/yf2?symbol=TSLA
/api/yf2?operation=quote&symbols=AAPL,MSFT,TSLA
```

### `search`

- requires `query`

Example:

```txt
/api/yf2?operation=search&query=tesla
```

### `historical`

- requires `symbol`
- requires `options.period1`

Example:

```json
{
  "operation": "historical",
  "symbol": "TSLA",
  "options": {
    "period1": "2024-01-01",
    "interval": "1d"
  }
}
```

### `fundamentalsTimeSeries`

- requires `symbol`
- requires `options.period1`
- requires `options.module`

Example:

```json
{
  "operation": "fundamentalsTimeSeries",
  "symbol": "AAPL",
  "options": {
    "period1": "2024-01-01",
    "module": "financials",
    "type": "annual"
  }
}
```

### `chart`

- requires `symbol`
- requires `options.period1`

Example:

```json
{
  "operation": "chart",
  "symbol": "TSLA",
  "options": {
    "period1": "2024-01-01",
    "interval": "1d",
    "includePrePost": true
  }
}
```

### `recommendationsBySymbol`

- accepts `symbol` or `symbols`

Example:

```txt
/api/yf2?operation=recommendationsBySymbol&symbol=TSLA
```

### `quoteSummary`

- requires `symbol`

Example:

```txt
/api/yf2?operation=quoteSummary&symbol=TSLA&modules=price,summaryDetail
```

### `trendingSymbols`

- requires `query` or `options.region`
- the region is uppercased before the Yahoo request

Example:

```txt
/api/yf2?operation=trendingSymbols&query=US&count=10
```

### `screener`

- requires `query` or `options.scrIds`
- `query` should be a predefined Yahoo screener id such as `day_gainers` or `most_actives`

Example:

```txt
/api/yf2?operation=screener&query=day_gainers&count=25
```

### `insights`

- requires `symbol`

Example:

```txt
/api/yf2?operation=insights&symbol=TSLA
```

### `options`

- requires `symbol`
- `options.date` can be an ISO date string or timestamp

Example:

```txt
/api/yf2?operation=options&symbol=TSLA&date=2026-06-19
```

## Error Handling

- `400`: invalid input or missing required fields
- `404`: symbol or quote data not found
- `502`: upstream Yahoo Finance failure

Error shape:

```json
{
  "error": "Message here"
}
```

## Implementation Notes

- symbols are normalized to uppercase before requests are sent
- the shared Yahoo client is instantiated once in [index.ts](./index.ts)
- if you need a new operation, add it to `YF2_OPERATIONS` and extend `executeYf2Request()`
