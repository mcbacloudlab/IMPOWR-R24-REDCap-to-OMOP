import React from "react";
import Box from "@mui/material/Box";
import MaterialReactTable from "material-react-table";
import { darken, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function FormSelectTable({
  columns,
  data,
  isSavingErr,
  setSorting,
  handleSaveRow,
  saveSuccess,
  isSaving,
  saveFile,
  value,
  handleExportData,
  resetScreen

}) {
  // console.log('form seldata', data)
  return (
    <MaterialReactTable
      columns={columns}
      data={data} //10,000 rows
      enableDensityToggle={false} //density does not work with memoized cells
      memoMode="cells" // memoize table cells to improve render performance, but break some features
      enableBottomToolbar={true}
      enableGlobalFilterModes={true}
      enablePagination={true}
      // enableRowNumbers
      // enableRowVirtualization
      muiTableContainerProps={{
        sx: { maxHeight: "40vh" },
      }}
      onSortingChange={setSorting}
      // state={{ isLoading, sorting }}
      // rowVirtualizerInstanceRef={
      //   rowVirtualizerInstanceRef
      // } //optional
      // rowVirtualizerProps={{ overscan: 8 }} //optionally customize the virtualizer
      initialState={{
        density: "compact",
        // pagination: { pageSize: 50, pageIndex: 0 },
      }}
      // enableEditing
      // onEditingRowSave={handleSaveRow}
      // editingMode="modal"
      // muiTableBodyCellEditTextFieldProps={({
      //   cell,
      // }) => ({
      //   //onBlur is more efficient, but could use onChange instead
      //   onBlur: (event) => {
      //     handleSaveCell(cell, event.target.value);
      //   },
      // })}
      enableColumnResizing={true}
      enableSorting={true}
      enableStickyHeader
      muiTablePaperProps={{
        elevation: 2, //change the mui box shadow
        //customize paper styles
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
            backgroundColor: "#4a4a4a",
            color: "#ffffff",
          },
        }),
      }}
      muiTableHeadCellProps={{
        sx: (theme) => ({
          div: {
            backgroundColor: "#4a4a4a",
            color: "#ffffff",
          },
        }),
      }}
      defaultColumn={{
        minSize: 20, //allow columns to get smaller than default
        maxSize: 9000, //allow columns to get larger than default
        size: 380, //make columns wider by default
      }}
      // enableStickyFooter

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
          {/* <Button
            variant="contained"
            color="primary"
            component="label"
            startIcon={
              saveSuccess ? (
                <CheckIcon />
              ) : isSaving || isSavingErr ? (
                <CircularProgress size={20} thickness={4} color="secondary" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={(event) => saveFile(event, value)}
          >
            Save
          </Button> */}

          <Button
            color="success"
            //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
            onClick={handleExportData}
            startIcon={<FileDownloadIcon />}
            variant="outlined"
          >
            Export
          </Button>
          {/* <Typography
            color="textSecondary"
            variant="subtitle2"
            style={{ marginLeft: "auto" }}
          > */}
            {/* Last Saved At:{" "} */}
          {/* </Typography> */}

          <Box style={{ marginLeft: "auto" }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              component="label"
              onClick={(event) => resetScreen(event, value)}
            >
              Close File
            </Button>
          </Box>
        </Box>
      )}
    />
  );
}