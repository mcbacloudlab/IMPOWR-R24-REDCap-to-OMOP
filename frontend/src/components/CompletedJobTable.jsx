import React from "react";
import Box from "@mui/material/Box";
import MaterialReactTable from "material-react-table";
import { Button } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
// import SaveIcon from "@mui/icons-material/Save";
// import CircularProgress from "@mui/material/CircularProgress";
// import CheckIcon from "@mui/icons-material/Check";
// import TableRow from "@mui/material/TableRow";

export default function CompletedJobTable({
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
  resetScreen,
  selectedTabIdx,
}) {
  // console.log('completed job table', selectedTabIdx)
  return (
    <MaterialReactTable
      //passing the callback function variant. (You should get type hints for all the callback parameters available)
      columns={columns}
      data={data} 
      enableDensityToggle={false} //density does not work with memoized cells
      memoMode="cells" // memoize table cells to improve render performance, but break some features
      enableBottomToolbar={true}
      enableGlobalFilterModes={true}
      enablePagination={true}
      {...(selectedTabIdx === 2 ? {} : { enableExpanding: true })}
      getSubRows={(originalRow) => {
        return originalRow.subRows;
      }} //default, can customize
      paginateExpandedRows={false}
      RowProps={{ sx: { marginBottom: "10px" } }}
      // enableRowNumbers
      // enableRowVirtualization
      muiTableContainerProps={{
        sx: {
          maxWidth: "100vw",
          maxHeight: "50vh",
        },
      }}
      onSortingChange={setSorting}
      initialState={{
        density: "compact",
        // pagination: { pageSize: 50, pageIndex: 0 },
      }}
      enableColumnResizing={true}
      enableSorting={true}
      enableStickyHeader
      muiTableProps={{
        sx: {
          borderCollapse: "separate",
          borderSpacing: "0 10px", // set the desired space between rows
        },
      }}
      muiTablePaperProps={{
        elevation: 2, //change the mui box shadow
        //customize paper styles
        sx: {
          borderRadius: "0",
          border: "1px solid #e0e0e0",
        },
      }}
      muiTableBodyProps={{
        sx: {
          "& .subrow": {
            backgroundColor: "pink",
          },
        },
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
      muiTableBodyRowProps={({ row }) => ({
        color: "yellow",
        disabled: row.original.isAccountLocked, //access the row data to determine if the checkbox should be disabled
      })}
      // defaultColumn={{
      //   minSize: 20, //allow columns to get smaller than default
      //   maxSize: 9000, //allow columns to get larger than default
      //   size: 400, //make columns wider by default
      // }}
      autoWidth={true}
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
          {selectedTabIdx === 2 && (
            <Button
              color="success"
              //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
              onClick={handleExportData}
              startIcon={<FileDownloadIcon />}
              variant="contained"
            >
              Export Data Dictionary
            </Button>
          )}

          {/* <Typography
            color="textSecondary"
            variant="subtitle2"
            style={{ marginLeft: "auto" }}
          > */}
          {/* Last Saved At:{" "} */}
          {/* </Typography> */}

          <Box style={{ marginLeft: "auto" }}>
            {/* <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              component="label"
              onClick={(event) => resetScreen(event, value)}
            >
              Close File
            </Button> */}
          </Box>
        </Box>
      )}
    />
  );
}
