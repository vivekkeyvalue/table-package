import { Row } from "./types";
import { CELL_VALUE_TYPES, CellValueType } from './constants';

export const formatCurrency = (value: any) => {
  const formattedValue = Math.abs(Number(value)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `- $${formattedValue}` : `$${formattedValue}`;
};

export const checkCellValueType = (type: string, value: any) => {
  switch (type) {
    case CELL_VALUE_TYPES.STRING:
    case CELL_VALUE_TYPES.DATE:
      return value;
    case CELL_VALUE_TYPES.PERCENTAGE:
      return Number(value) === 0
        ? "-"
        : `${(Number(value) * 100).toFixed(2)}%`;
    case CELL_VALUE_TYPES.CURRENCY:
      return Number(value) === 0 ? "-" : formatCurrency(value);
    default:
      return null;
  }
};

export const getCellValueAllignment = (type: CellValueType | undefined): 'left' | 'center' | 'right' => {
  switch (type) {
    case CELL_VALUE_TYPES.PERCENTAGE:
    case CELL_VALUE_TYPES.CURRENCY:
      return 'right';
    case CELL_VALUE_TYPES.STRING:
    case CELL_VALUE_TYPES.DATE:
      return 'left';
    default:
      return 'center';
  }
};

export const isAllRowsExpanded = <T>(rows: Row<T>[], expandedRows: Record<string, boolean>): boolean => {
  for (const row of rows) {
      if (row.children && (!expandedRows[row.id] || !isAllRowsExpanded(row.children, expandedRows)))
        return false;
    }
  return true;
};