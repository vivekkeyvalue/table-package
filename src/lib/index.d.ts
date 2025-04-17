import { ReactNode, ReactElement } from "react";

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T, level?: number) => ReactNode;
  renderHeader?: (column: Column<T>) => ReactNode;
};

export type Row<T> = T & {
  id: string;
  children?: Row<T>[];
  getChildren?: (rowId: string) => Row<T>[];
};

export type RowAction = {
  label?: string;
  icon?: string;
  renderUpdateComponent?: any;
  condition?: (rowId: string) => boolean;
  action?: (rowId: string, el?: any) => void;
  component?: ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
};

export type GenericTableProps<T> = {
  data: Row<T>[];
  columns: Column<T>[];
  meta: any;
  actions?: RowAction[];
  onViewRow?: (row: Row<T>) => void;
  isLoading?: boolean;
  depth?: number | null;
  showTotal?: boolean;
};

declare const GenericTable: <T>(props: GenericTableProps<T>) => ReactElement;

export default GenericTable; 