import React, { ReactNode, useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  DEFAULT_ROW_COLORS,
  TABLE_TYPES,
  ICON_POSITIONS,
  ACTION_TYPES,
  DEFAULT_TABLE_CELL_STYLES,
  DEFAULT_TABLE_HEADER_STYLES,
} from './constants';
import {
  checkCellValueType,
  getCellValueAllignment,
  isAllRowsExpanded,
} from './utils';
import { GenericTableProps, Row, RowAction } from './types';

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
    setAllExpanded(isAllRowsExpanded(data, expandedRows));
  }, [expandedRows, data]);

  const isShowActionColumn = Boolean(actions?.length);

  const columnMetadata = meta?.columns?.reduce((obj, item) => {
    obj[item.id] = item;
    return obj;
  }, {} as Record<string, any>) ?? {};

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
  };

  const handleExpandRowClick = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandDynamicChildrenRowClick = async (
    rowIndex: number,
    row: Row<T>,
    e: React.MouseEvent
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
      actionHandler(rowId, el);
    }
  };

  const renderCellContent = (row: Row<T>, key: string): ReactNode => {
    const value = row[key];
    const columnType = columnMetadata[key]?.type;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const renderValue = checkCellValueType(columnType, value);
      const pivotColumnType = meta?.columns?.[2]?.type;

      if (!renderValue && meta?.chartType === TABLE_TYPES.PIVOT && pivotColumnType) {
        return checkCellValueType(pivotColumnType, value);
      }

      const icons = columnMetadata[key]?.icons;
      let leftIcon: ReactNode = null;
      let rightIcon: ReactNode = null;

      if (icons?.length) {
        icons.forEach((icon: { type: string; condition: any; location: any; position: string; }) => {
          if (
            icon.type === ACTION_TYPES.CONDITIONAL &&
            icon.condition &&
            new Function('row', `return ${icon.condition};`)(row)
          ) {
            const iconElement = (
              <img
                src={require(`${icon.location}`)}
                alt={`${icon.position}_icon`}
                className="table-icon"
              />
            );
            if (icon.position === ICON_POSITIONS.LEFT) {
              leftIcon = iconElement;
            } else if (icon.position === ICON_POSITIONS.RIGHT) {
              rightIcon = iconElement;
            }
          }
        });
      }

      if (value === 'null') {
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
          {meta.chartType === TABLE_TYPES.MULTI_LEVEL && (
            <TableCell sx={{ border: "none" }}></TableCell>
          )}
          {columns.map((column, colIndex) => (
            <TableCell
              key={String(column.key)}
              sx={{
                ...DEFAULT_TABLE_CELL_STYLES,
                ...tableCellStyles,
                borderLeft: colIndex === 0 ? "1px solid #2F736E1F" : "none",
                borderRight: "1px solid #2F736E1F",
                background: "#FFFFFF",
                borderTopLeftRadius: colIndex === 0 ? "8px" : "0px",
                borderBottomLeftRadius: colIndex === 0 ? "8px" : "0px",
                borderTopRightRadius:
                colIndex === columns.length - 1 ? "8px" : "0px",
                borderBottomRightRadius:
                colIndex === columns.length - 1 ? "8px" : "0px",
              }}
            >
              {column.render
                ? column.render(row[column.key as keyof Row<T>], row as T, 0)
                : renderCellContent(row, column.key as string)}
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
              onClick={() => onViewRow?.(row)}
            >
              {meta?.chartType === TABLE_TYPES.MULTI_LEVEL && (
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
              {columns.map((column, colIndex) => (
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
                    ? column.render(row[column.key as keyof Row<T>], row as T, level)
                    : renderCellContent(row, column.key as string)}
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
            onClick={() => onViewRow?.(row)}
          >
            {meta?.chartType === TABLE_TYPES.MULTI_LEVEL && (
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
            {columns.map((column, colIndex) => (
              <TableCell
                key={String(column.key)}
                sx={{
                  ...DEFAULT_TABLE_CELL_STYLES,
                  ...tableCellStyles,
                  border: "none",
                  borderLeft:
                  colIndex === 0 || level === depth
                      ? "none"
                      : "1px solid #2F736E1F",
                  background: getRowCellBackGround(level),
                  borderTopLeftRadius: colIndex === 0 ? "8px" : "0px",
                  borderBottomLeftRadius: colIndex === 0 ? "8px" : "0px",
                  borderTopRightRadius:
                  colIndex === columns.length - 1 ? "8px" : "0px",
                  borderBottomRightRadius:
                  colIndex === columns.length - 1 ? "8px" : "0px",
                }}
              >
                {column.render
                  ? column.render(row[column.key as keyof Row<T>], row as T, level)
                  : renderCellContent(row, column.key as string)}
              </TableCell>
            ))}
            {isShowActionColumn && level === 0 && (
              <TableCell className="table-cell table-cell--action">
                {actions?.map((action, index) => {
                  if (action?.condition && !action.condition(row.id)) {
                    return null;
                  }
                  if (action.component) {
                    return React.cloneElement(action.component, {
                      onClick: (e: React.MouseEvent) => {
                        if (!action.action) return;
                        action.action(row.id, e);
                      },
                    });
                  }
                  return (
                    <button
                      key={String(`${row.id}_${rowIndex}_${index}_action`)}
                      onClick={(e) => {
                        handleRowActionClick(row.id, action);
                        e.stopPropagation();
                      }}
                      className="table-button table-button--action"
                    >
                      {action.icon && (
                        <img
                          src={require(`${action.icon}`)}
                          alt="action_icon"
                          className="table-icon"
                        />
                      )}
                      <Typography className="table-cell--action-label">
                        {action.label}
                      </Typography>
                    </button>
                  );
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
              {meta.chartType === TABLE_TYPES.MULTI_LEVEL && (
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
                      columnMetadata[String(column.key)]?.type
                    ),
                  }}
              >
                {column.renderHeader ? column.renderHeader(column) : column.label}
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
