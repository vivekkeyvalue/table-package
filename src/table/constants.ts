import { CSSProperties } from 'react';

export const DEFAULT_ROW_COLORS = ['#FFFFFF', '#F0F0F1'];

export const DEFAULT_TABLE_HEADER_STYLES: CSSProperties = {
  padding: "0.75rem 0.5rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: "1rem",
  color: "#F6F8F9",
  borderLeft: "1px solid #737F86",
  borderBottom: "none",
  background: "#2F736E",
};

export const DEFAULT_TABLE_CELL_STYLES: CSSProperties = {
  padding: "0.75rem 0.5rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: "1rem",
  color: "#1B1C17",
  border: "none",
  borderLeft: "1px solid #2F736E1F",
}; 

export const TABLE_TYPES = {
  MULTI_LEVEL: 'MULTI_LEVEL_TABLE',
  PIVOT: 'PIVOT_TABLE',
};

export const ICON_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
};

export const ACTION_TYPES = {
  CONDITIONAL: 'conditional',
};

export const CELL_VALUE_TYPES = {
  PERCENTAGE: 'percentage',
  STRING: 'string',
  CURRENCY: 'currency',
  DATE: 'date',
};

export type CellValueType = typeof CELL_VALUE_TYPES[keyof typeof CELL_VALUE_TYPES]; 