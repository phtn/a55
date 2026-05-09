import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ReactNode } from 'react'

interface SimpleTableProps {
  title: string
  data: Record<string, unknown>
}

interface TableRowData {
  key: string
  value: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const formatKey = (key: string) =>
  key
    .replaceAll('.', ' / ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())

const formatNumber = (value: number) => {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

const renderPrimitive = (value: unknown): ReactNode => {
  if (value === null) {
    return <span className='font-brk text-zinc-500 dark:text-rose-300 italic'>null</span>
  }

  if (value === undefined) {
    return <span className='text-zinc-500 dark:text-zinc-400'>-</span>
  }

  if (typeof value === 'number') {
    return <span className='font-brk text-sky-600 dark:text-sky-300'>{formatNumber(value)}</span>
  }

  if (typeof value === 'boolean') {
    return <span className='font-brk text-indigo-600 dark:text-indigo-400'>{String(value)}</span>
  }

  return (
    <span className='text-orange-500 dark:text-orange-300'>
      &quot;<span className='wrap-break-words'>{String(value)}</span>&quot;
    </span>
  )
}

const renderArray = (value: unknown[]) => {
  if (value.length === 0) {
    return <span className='text-zinc-500 dark:text-zinc-400'>[]</span>
  }

  if (value.every((item) => !isRecord(item) && !Array.isArray(item))) {
    return (
      <span className='inline-flex flex-wrap gap-x-1'>
        {value.map((item, index) => (
          <span key={index}>
            {renderPrimitive(item)}
            {index < value.length - 1 ? <span className='text-zinc-500 dark:text-zinc-400'>,</span> : null}
          </span>
        ))}
      </span>
    )
  }

  return (
    <span className='text-zinc-400 dark:text-zinc-500'>
      [
      <span className='text-zinc-600 dark:text-zinc-400'>
        {value.length.toLocaleString()} item{value.length === 1 ? '' : 's'}
      </span>
      ]
    </span>
  )
}

const renderTableValue = (value: unknown): ReactNode => {
  if (Array.isArray(value)) {
    return renderArray(value)
  }

  if (isRecord(value)) {
    return (
      <span className='text-zinc-400 dark:text-zinc-500'>
        {'{'}
        <span className='text-zinc-600 dark:text-zinc-400'>
          {Object.keys(value).length.toLocaleString()} key{Object.keys(value).length === 1 ? '' : 's'}
        </span>
        {'}'}
      </span>
    )
  }

  return renderPrimitive(value)
}

const toRows = (data: Record<string, unknown>) => {
  const rows: TableRowData[] = []

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      rows.push({ key, value })
      continue
    }

    if (isRecord(value)) {
      for (const [childKey, childValue] of Object.entries(value)) {
        rows.push({
          key: `${key}.${childKey}`,
          value: childValue
        })
      }
      continue
    }

    rows.push({ key, value })
  }

  return rows
}

export const SimpleTable = ({ title, data }: SimpleTableProps) => {
  const rows = toRows(data)

  return (
    <section className='min-w-0 overflow-hidden rounded border border-border bg-background'>
      <div className='border-b border-border bg-muted/40 px-3 py-2'>
        <h3 className='font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground/70'>{title}</h3>
      </div>
      <div className='overflow-hidden'>
        <Table>
          <TableBody className=''>
            {rows.map((item) => (
              <TableRow key={item.key} className='*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r'>
                <TableCell className='w-1/2 bg-muted/30 px-3 py-2 align-top text-xs font-medium whitespace-normal text-foreground/70'>
                  {formatKey(item.key)}
                </TableCell>
                <TableCell className='px-3 py-2 align-top font-mono text-xs whitespace-normal wrap-break-word text-foreground'>
                  {renderTableValue(item.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
