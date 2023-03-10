import React from "react";
import Box from "@mui/material/Box";
import MaterialReactTable from "material-react-table";
import { darken, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function FormSelectTable({
  columns,
  data,
  setSorting,
  value,
  handleExportData,
  resetScreen,
  handleRowSelection,
  selectedRows,
  setSelectedRows,
  tableInstanceRef,
}) {
  // console.log('form seldata', data)
  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      enableDensityToggle={false}
      memoMode="cells"
      enableBottomToolbar={true}
      enableGlobalFilterModes={true}
      enablePagination={true}
      enableRowNumbers
      enableRowSelection
      tableInstanceRef={tableInstanceRef}
      selectAllMode='page'
      // onRowSelectionChange={handleRowSelection} //connect internal row selection state to your own
      state={{ selectedRows }} //pass our managed row selection state to the table to use
      getRowId={(row) => row.field_name} //give each row a more useful id
      muiTableBodyRowProps={({ row }) => ({
        //add onClick to row to select upon clicking anywhere in the row
        // onClick: row.getToggleSelectedHandler(),
        // sx: { cursor: "pointer" },
        onClick: () => 
          setSelectedRows((prev) => ({
            ...prev,
            [row.id]: !prev[row.id],
          })),
        selected: selectedRows[row.id],
        sx: {
          cursor: "pointer",
        },
        
      })}
      // selectedRows={selectedRows}
      muiTableContainerProps={{
        sx: { maxHeight: "80vh" },
      }}
      onSortingChange={setSorting}
      initialState={{
        density: "compact",
      }}
      enableColumnResizing={true}
      enableSorting={true}
      enableStickyHeader
      muiSelectCheckboxProps={{ color: "secondary" }}
      muiTablePaperProps={{
        elevation: 2,
        sx: {
          borderRadius: "0",
          border: "1px solid #e0e0e0",
        },
      }}
      muiTableBodyProps={{
        sx: (theme) => ({
          "& tr:nth-of-type(odd)": {
            backgroundColor: darken(theme.palette.background.default, 0.1),
          },
        }),
      }}
      muiTableHeadProps={{
        sx: (theme) => ({
          "& tr": {
            backgroundColor: "#343541",
            color: "#ffffff",
          },
        }),
      }}
      muiTableHeadCellProps={{
        sx: (theme) => ({
          div: {
            backgroundColor: "#343541",
            color: "#ffffff",
          },
        }),
      }}
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (
        <Box
          width="100%"
          sx={{
            display: "flex",
            gap: "1rem",
            p: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={() =>
              console.info(tableInstanceRef.current?.getSelectedRowModel().rows)
            }
          >
            Log Selected Rows
          </Button>
          <Button
            color="success"
            onClick={handleExportData}
            startIcon={<FileDownloadIcon />}
            variant="outlined"
          >
            Export to Excel
          </Button>

          <Box style={{ marginLeft: "auto" }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              component="label"
              onClick={(event) => resetScreen(event, value)}
            >
              Close
            </Button>
          </Box>
        </Box>
      )}
    />
  );
}
