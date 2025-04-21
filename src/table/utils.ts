import { Row } from "./types";

export const formatCurrency = (value: any) => {
  const formattedValue = Math.abs(Number(value)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `- $${formattedValue}` : `$${formattedValue}`;
};

export const checkCellValueType = (type: string, value: any) => {
  switch (type) {
    case "string":
      return value;
    case "percentage":
      return Number(value) === 0
        ? "-"
        : `${(Number(value) * 100).toFixed(2)}%`;
    case "currency":
      return Number(value) === 0 ? "-" : formatCurrency(value);
    case "date":
      return value;
    default:
      return null;
  }
};

export const getCellValueAllignment = (type: string) => {
  switch (type) {
    case "percentage":
    case "currency":
      return "right";
    case "string":
    case "date":
      return "left";
    default:
      return "center";
  }
};

export const isAllRowsExpanded = (rows: Row<any>[], expandedRows: Record<string, boolean>): boolean => {
  for (const row of rows) {
    if (row.children) {
      if (!expandedRows[row.id] || !isAllRowsExpanded(row.children, expandedRows))
        return false;
    }
  }
  return true;
}; 