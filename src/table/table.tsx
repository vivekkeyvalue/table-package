import React, { ReactElement, ReactNode, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

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
  tableHeaderStyles?: React.CSSProperties;
  tableCellStyles?: React.CSSProperties;
  rowColors?: [string, string];
};

const DEFAULT_ROW_COLORS: [string, string] = ["#D8DBDD", "#F0F0F1"];

const DEFAULT_TABLE_HEADER_STYLES: React.CSSProperties = {
  padding: "0.75rem 0.5rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: "1rem",
  color: "#F6F8F9",
  borderLeft: "1px solid #737F86",
  borderBottom: "none",
  background: "#2F736E",
};

const DEFAULT_TABLE_CELL_STYLES: React.CSSProperties = {
  padding: "0.75rem 0.5rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: "1rem",
  color: "#1B1C17",
  border: "none",
  borderLeft: "1px solid #2F736E1F",
};

function GenericTable<T>({
  data,
  columns,
  meta,
  actions,
  onViewRow,
  isLoading,
  depth,
  showTotal = false,
  tableHeaderStyles,
  tableCellStyles,
  rowColors = DEFAULT_ROW_COLORS,
}: GenericTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [updatingRowId, setUpdatingRowId] = useState<string | null>(null);
  const [dynamicNestedRows, setDynamicNestedRows] = useState<{
    index: number;
    dynamicRows: Row<T>[] | null;
  }>({ index: -1, dynamicRows: null });

  useEffect(() => {
    const allExpanded = isAllRowsExpanded(data);
    setAllExpanded(allExpanded);
  }, [expandedRows, data]);

  const isShowActionColumn = Boolean(actions?.length);

  const columnMetadata = meta?.columns?.length
    ? meta.columns.reduce((obj: any, item: any) => {
        obj[item.id] = item;
        return obj;
      }, {})
    : [];

  const handleExpandAllRows = () => {
    const newExpandState = !allExpanded;
    setAllExpanded(newExpandState);

    const updatedExpandedRows: Record<string, boolean> = {};
    const setAllRowState = (rows: Row<T>[]) => {
      rows.forEach((row) => {
        updatedExpandedRows[row.id] = newExpandState;
        if (row.children) {
          setAllRowState(row.children);
        }
      });
    };
    setAllRowState(data);

    setExpandedRows(updatedExpandedRows);

    const updateRowsState = (rows: Row<T>[], isExpanded: boolean) => {
      rows.forEach((row) => {
        if (row.children) {
          updateRowsState(row.children, isExpanded);
        }
      });
    };
    updateRowsState(data, newExpandState);
  };

  const handleExpandRowClick = (id: string) => {
    setExpandedRows((prev) => {
      const isExpanded = !prev[id];
      return { ...prev, [id]: isExpanded };
    });
  };

  const handleExpandDynamicChildrenRowClick = async (
    rowIndex: number,
    row: any,
    e: any
  ) => {
    e.stopPropagation();
    if (
      dynamicNestedRows?.dynamicRows?.length &&
      (dynamicNestedRows.dynamicRows[0].id as string).includes(row.id)
    ) {
      setDynamicNestedRows({ index: -1, dynamicRows: null });
      return;
    }
    setDynamicNestedRows({ index: -1, dynamicRows: null });

    if (row.getChildren) {
      const childRows = await row.getChildren(row.id);
      setDynamicNestedRows({ index: rowIndex, dynamicRows: childRows });
    }
  };

  const handleRowActionClick = (rowId: string, action: RowAction, el?: any) => {
    if (!action || !isShowActionColumn) return;

    const { renderUpdateComponent, action: actionHandler } = action;

    if (renderUpdateComponent) {
      setUpdatingRowId((prev) => (prev === rowId ? null : rowId));
    } else if (actionHandler) {
      if (el) {
        actionHandler(rowId, el);
      } else {
        actionHandler(rowId);
      }
    }
  };

  const isAllRowsExpanded = (rows: Row<T>[]): boolean => {
    for (const row of rows) {
      if (row.children) {
        if (!expandedRows[row.id] || !isAllRowsExpanded(row.children))
          return false;
      }
    }
    return true;
  };

  const formatCurrency = (value: any) => {
    const formattedValue = Math.abs(Number(value)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return value < 0 ? `- $${formattedValue}` : `$${formattedValue}`;
  };

  const checkCellValueType = (type: string, value: any) => {
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

  const getCellValueAllignment = (type: string) => {
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

  const renderCellContent = (row: any, key: any): ReactNode => {
    const value = row[key];
    const columnType = columnMetadata[key]?.type;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      let renderValue = checkCellValueType(columnType, value);
      const pivotColumnType = meta?.columns?.[2]?.type;

      // Handle pivot table columns where type needs to be inferred from metadata
      if (!renderValue && meta.chartType === "PIVOT_TABLE") {
        if (pivotColumnType) {
          renderValue = checkCellValueType(pivotColumnType, value);
        }
      }

      const icons = columnMetadata[key]?.icons;
      let leftIcon: React.ReactNode = null;
      let rightIcon: React.ReactNode = null;

      if (icons && Array.isArray(icons)) {
        icons.forEach((icon) => {
          if (
            icon.type === "conditional" &&
            icon.condition &&
            // eslint-disable-next-line no-new-func
            new Function("row", `return ${icon.condition};`)(row)
          ) {
            if (icon.position === "left") {
              leftIcon = (
                <img
                  src={require(`${icon.location}`)}
                  alt="left_icon"
                  style={{ marginRight: "8px", userSelect: "none" }}
                />
              );
            } else if (icon.position === "right") {
              rightIcon = (
                <img
                  src={require(`${icon.location}`)}
                  alt="right_icon"
                  style={{ marginLeft: "8px", userSelect: "none" }}
                />
              );
            }
          }
        });
      }

      if (value === "null") {
        return (
          <span
            style={{
              width: "100%",
              minWidth: "3rem",
              display: "flex",
              justifyContent: getCellValueAllignment(columnType),
            }}
          >
            N/A
          </span>
        );
      }

      return (
        <span
          style={{
            width: "100%",
            minWidth: columnType === "currency" ? "6rem" : "3rem",
            display: "flex",
            justifyContent: getCellValueAllignment(columnType),
            ...(columnType === "currency" || pivotColumnType === "currency"
              ? { whiteSpace: "nowrap" }
              : {}),
          }}
        >
          {leftIcon}
          {renderValue ?? value}
          {rightIcon}
        </span>
      );
    }

    return (
      <span
        style={{
          width: "100%",
          minWidth: "3rem",
          display: "flex",
          justifyContent: getCellValueAllignment(columnType),
        }}
      >
        -
      </span>
    );
  };

  const getRowCellBackGround = (index: number) => {
    if (depth && depth === index) {
      return "#FFFFFF";
    } else {
      return rowColors[index % 2 ? 0 : 1];
    }
  };

  const renderDynamicRows = (dynamicRows: Row<T>[]) => {
    return dynamicRows.map((row) => (
      <React.Fragment key={`${row.id}`}>
        <TableRow style={{ backgroundColor: "#FFFFFF" }}>
          {meta.chartType === "MULTI_LEVEL_TABLE" && (
            <TableCell sx={{ border: "none" }}></TableCell>
          )}
          {columns.map((column, colindex) => (
            <TableCell
              key={String(column.key)}
              sx={{
                ...DEFAULT_TABLE_CELL_STYLES,
                ...tableCellStyles,
                borderLeft: colindex === 0 ? "1px solid #2F736E1F" : "none",
                borderRight: "1px solid #2F736E1F",
                background: "#FFFFFF",
                borderTopLeftRadius: colindex === 0 ? "8px" : "0px",
                borderBottomLeftRadius: colindex === 0 ? "8px" : "0px",
                borderTopRightRadius:
                  colindex === columns.length - 1 ? "8px" : "0px",
                borderBottomRightRadius:
                  colindex === columns.length - 1 ? "8px" : "0px",
              }}
            >
              {column.render
                ? column.render(row[column.key], row, 0)
                : renderCellContent(row, column.key)}
            </TableCell>
          ))}
        </TableRow>
      </React.Fragment>
    ));
  };

  const renderRows = (rows: Row<T>[], level = 0): ReactNode => {
    return rows.map((row, rowIndex) => {
      const isExpanded = expandedRows[row.id];
      const isUpdating = updatingRowId === row.id;
      const actionWithRenderUpdate = actions?.find(
        (action) => action?.renderUpdateComponent
      );
      if (isUpdating && actionWithRenderUpdate) {
        return (
          <React.Fragment key={`${row.id}_${rowIndex}`}>
            <TableRow
              style={{
                backgroundColor: "#FFFFFF",
                cursor: onViewRow ? "pointer" : "default",
                border: "none",
                borderBottom: "1px solid #2F736E1F",
              }}
              onClick={() => {
                if (onViewRow) onViewRow(row);
              }}
            >
              {meta.chartType === "MULTI_LEVEL_TABLE" && (
                <TableCell
                  style={{
                    width: "5px",
                    paddingLeft: `${level * 20 + 10}px`,
                    paddingTop: 0,
                    paddingBottom: 0,
                    backgroundColor: "#2F736E1F",
                    lineHeight: "1rem",
                    paddingRight: "0px",
                    border: "none",
                    borderTopLeftRadius: "8px",
                    borderBottomLeftRadius: "8px",
                  }}
                ></TableCell>
              )}
              {columns.map((column, colindex) => (
                <TableCell
                  key={String(column.key)}
                  sx={{
                    ...DEFAULT_TABLE_CELL_STYLES,
                    ...tableCellStyles,
                    border: "none",
                    borderLeft: "1px solid #2F736E1F",
                    background: "#2F736E1F",
                  }}
                >
                  {column.render
                    ? column.render(row[column.key], row, level)
                    : renderCellContent(row, column.key)}
                </TableCell>
              ))}
              {isShowActionColumn && level === 0 && (
                <TableCell
                  key={String(`${row.id}_${rowIndex}_actions`)}
                  sx={{
                    ...DEFAULT_TABLE_CELL_STYLES,
                    ...tableCellStyles,
                    paddingY: "0.75rem",
                    border: "none",
                    borderLeft: "1px solid #2F736E1F",
                    background: "#2F736E1F",
                    borderTopRightRadius: "8px",
                    borderBottomRightRadius: "8px",
                  }}
                ></TableCell>
              )}
            </TableRow>
            <TableRow key={`selected_${row.id}`}>
              <TableCell
                colSpan={columns.length + 2}
                style={{
                  padding: 0,
                  backgroundColor: "#2F736E1F",
                  borderBottom: "none",
                  borderRadius: "16px",
                }}
              >
                {actionWithRenderUpdate.renderUpdateComponent(row, () =>
                  setUpdatingRowId(null)
                )}
              </TableCell>
            </TableRow>
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={`${row.id}_${rowIndex}`}>
          <TableRow
            style={{
              backgroundColor:
                rowIndex === rows.length - 1 && showTotal
                  ? "#2F736E"
                  : "#F0F0F1",
              cursor: onViewRow ? "pointer" : "default",
            }}
            onClick={() => {
              if (onViewRow) onViewRow(row);
            }}
          >
            {meta.chartType === "MULTI_LEVEL_TABLE" && (
              <TableCell
                style={{
                  width: "5px",
                  paddingLeft: `${level * 20 + 10}px`,
                  paddingTop: 0,
                  paddingBottom: 0,
                  backgroundColor: "white",
                  borderBottom: "none",
                  lineHeight: "1rem",
                  paddingRight: "0px",
                }}
              >
                {row.children && (
                  <button
                    onClick={() => handleExpandRowClick(row.id)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <ArrowDropDownIcon
                      style={{
                        color: "#162C36",
                        rotate: isExpanded ? "0deg" : "-90deg",
                      }}
                    />
                  </button>
                )}
                {!row.children && row.getChildren && (
                  <button
                    onClick={(e) =>
                      handleExpandDynamicChildrenRowClick(rowIndex, row, e)
                    }
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <ArrowDropDownIcon
                      style={{
                        color: "#162C36",
                        rotate:
                          dynamicNestedRows?.index === rowIndex || isExpanded
                            ? "0deg"
                            : "-90deg",
                      }}
                    />
                  </button>
                )}
              </TableCell>
            )}
            {columns.map((column, colindex) => (
              <TableCell
                key={String(column.key)}
                sx={{
                  ...DEFAULT_TABLE_CELL_STYLES,
                  ...tableCellStyles,
                  border: "none",
                  borderLeft:
                    colindex === 0 || level === depth
                      ? "none"
                      : "1px solid #2F736E1F",
                  background: getRowCellBackGround(level),
                  borderTopLeftRadius: colindex === 0 ? "8px" : "0px",
                  borderBottomLeftRadius: colindex === 0 ? "8px" : "0px",
                  borderTopRightRadius:
                    colindex === columns.length - 1 ? "8px" : "0px",
                  borderBottomRightRadius:
                    colindex === columns.length - 1 ? "8px" : "0px",
                }}
              >
                {column.render
                  ? column.render(row[column.key], row, level)
                  : renderCellContent(row, column.key)}
              </TableCell>
            ))}
            {isShowActionColumn && level === 0 && (
              <TableCell
                key={String(`${row.id}_${rowIndex}_actions`)}
                sx={{
                  ...DEFAULT_TABLE_CELL_STYLES,
                  ...tableCellStyles,
                  paddingY: "0.75rem",
                  paddingLeft: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: "1rem",
                  border: "none",
                  background: "#FFFFFF",
                  textAlign: "left",
                }}
              >
                {actions?.map((action, index) => {
                  if (action?.condition && !action.condition(row.id)) {
                    return <></>;
                  } else if (action.component) {
                    return React.cloneElement(action.component, {
                      onClick: (e: React.MouseEvent) => {
                        if (!action.action) return;
                        action.action(row.id, e);
                      },
                    });
                  } else {
                    return (
                      <button
                        key={String(`${row.id}_${rowIndex}_${index}_action`)}
                        onClick={(e) => {
                          handleRowActionClick(row.id, action);
                          e.stopPropagation();
                        }}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          padding: 0,
                          marginLeft: "0.5rem",
                        }}
                      >
                        {action.icon && (
                          <img
                            src={require(`${action.icon}`)}
                            alt="action_icon"
                            style={{ userSelect: "none" }}
                          />
                        )}
                        <Typography
                          fontSize={"0.875rem"}
                          fontWeight={600}
                          sx={{ color: "#51B8B0" }}
                        >
                          {action.label}
                        </Typography>
                      </button>
                    );
                  }
                })}
              </TableCell>
            )}
          </TableRow>
          {isExpanded && row.children && renderRows(row.children, level + 1)}
          {depth &&
          dynamicNestedRows?.index === rowIndex &&
          dynamicNestedRows?.dynamicRows?.length
            ? renderDynamicRows(dynamicNestedRows.dynamicRows)
            : null}
        </React.Fragment>
      );
    });
  };

  if (!data.length) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "90%",
            height: "10rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#FFFFFF",
          }}
        >
          {isLoading ? <div>Loading...</div> : <div>No data</div>}
        </div>
      </div>
    );
  }

  return (
    <>
      <TableContainer
        style={{
          width: "100%",
          height: "100%",
          marginBottom: "12px",
        }}
      >
        <Table
          sx={{
            borderSpacing: "0 10px",
            borderCollapse: "separate",
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                borderRadius: "20px",
                "& .MuiTableCell-root": {
                  ...DEFAULT_TABLE_HEADER_STYLES,
                  ...tableHeaderStyles,
                },
              }}
            >
              {meta.chartType === "MULTI_LEVEL_TABLE" && (
                <TableCell
                  sx={{
                    padding: 0,
                    paddingLeft: depth === 1 ? "0px" : "5px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    lineHeight: "1rem",
                    borderBottom: "none",
                    background: "#2F736E",
                    borderTopLeftRadius: "8px",
                    WebkitBorderBottomLeftRadius: "8px",
                    paddingRight: depth === 1 ? "0px" : "1rem",
                  }}
                >
                  <button
                    onClick={handleExpandAllRows}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "#6C6C6C",
                    }}
                  >
                    <ArrowDropDownIcon
                      style={{
                        color: "#9AD6D1",
                        rotate: allExpanded ? "0deg" : "-90deg",
                      }}
                    />
                  </button>
                </TableCell>
              )}
              {columns.map((column, i) => (
                <TableCell
                  key={String(column.key)}
                  sx={{
                    borderTopRightRadius:
                      i === columns.length - 1 && !isShowActionColumn
                        ? "8px"
                        : "0px",
                    borderBottomRightRadius:
                      i === columns.length - 1 && !isShowActionColumn
                        ? "8px"
                        : "0px",
                    borderTopLeftRadius:
                      meta.chartType !== "MULTI_LEVEL_TABLE" && i === 0
                        ? "8px"
                        : "0px",
                    WebkitBorderBottomLeftRadius:
                      meta.chartType !== "MULTI_LEVEL_TABLE" && i === 0
                        ? "8px"
                        : "0px",
                    textAlign: getCellValueAllignment(
                      columnMetadata[column.key]?.type
                    ),
                  }}
                >
                  {column.renderHeader
                    ? column.renderHeader(column)
                    : column.label}
                </TableCell>
              ))}
              {isShowActionColumn && (
                <TableCell
                  sx={{
                    borderTopRightRadius: "8px",
                    borderBottomRightRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>{renderRows(data)}</TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default GenericTable;
