import type { RowData } from '@tanstack/react-table'
import type { SortKey } from '@/api/types'

declare module '@tanstack/react-table' {
  /**
   * Lets column definitions carry the backend sort key and a fixed width.
   * Generic params must mirror the library's own signature exactly.
   */
  interface ColumnMeta<TData extends RowData, TValue> {
    sortKey?: SortKey
    width?: string
    _phantom?: [TData, TValue]
  }
}
