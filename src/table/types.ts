import { ReactElement, ReactNode } from 'react';
import { TABLE_TYPES, ICON_POSITIONS, ACTION_TYPES, CellValueType } from './constants';

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T, level: number) => ReactNode;
  renderHeader?: (column: Column<T>) => ReactNode;
}

export interface ColumnMetadata {
  id: string;
  type?: string;
  [key: string]: any;
}

export interface IconConfig {
  type: typeof ACTION_TYPES.CONDITIONAL;
  condition: string;
  location: string;
  position: typeof ICON_POSITIONS.LEFT | typeof ICON_POSITIONS.RIGHT;
}

export interface Row<T> {
  id?: string;
  children?: Row<T>[];
  getChildren?: (id: string) => Promise<Row<T>[]>;
  [key: string]: any;
}

export interface RowAction {
  label?: string;
  icon?: string;
  action?: (rowId: string, el?: any) => void;
  condition?: (rowId: string) => boolean;
  component?: ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  renderUpdateComponent?: (row: Row<any>, onClose: () => void) => ReactElement;
}

export interface GenericTableProps<T> {
  data: Row<T>[];
  columns: Column<T>[];
  meta?: {
    columns?: ColumnMetadata[];
    chartType?: typeof TABLE_TYPES[keyof typeof TABLE_TYPES];
  };
  actions?: RowAction[];
  onViewRow?: (row: Row<T>) => void;
  isLoading?: boolean;
  depth?: number | null;
  showTotal?: boolean;
  tableHeaderStyles?: React.CSSProperties;
  tableCellStyles?: React.CSSProperties;
  rowColors?: string[];
} 