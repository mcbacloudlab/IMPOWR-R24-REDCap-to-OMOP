import React from "react";
import Box from "@mui/material/Box";
import MaterialReactTable from "material-react-table";
import { Button, Tooltip } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import CSVIcon from "../assets/csv.png";

export default function CompletedJobTable({
  columns,
  data,
  setSorting,
  handleExportData,
  updateDD,
  selectedTabIdx,
}) {
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
      muiTableContainerProps={{
        sx: {
          maxWidth: "100vw",
          maxHeight: "50vh",
        },
      }}
      onSortingChange={setSorting}
      initialState={{
        density: "compact",
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
      autoWidth={true}
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
          {selectedTabIdx === 2 && (
            <>
              {/* <Tooltip
                title={
                  "This will use the below mappings and store a JSON object into the field_annotations column of the data dictionary in REDCap"
                }
                placement="top"
              > */}
                {/* <Button
                  color="warning"
                  onClick={updateDD}
                  startIcon={<StorageIcon />}
                  variant="contained"
                >
                  Update REDCap Dictionary
                </Button> */}
              {/* </Tooltip> */}

              <Box style={{ marginLeft: "auto" }}>
                <Tooltip title={"Export to CSV. This is the CSV file you can use with the desktop companion app. Optionally, you could also upload this data dictionary back into your REDCap. If you choose to upload this to your REDCap be aware this will overwrite the field_annotations in REDCap with the data used here."} placement="top">
                  <Button onClick={() => handleExportData("downloadExcel")}>
                    <img
                      src={CSVIcon}
                      alt="Export to CSV"
                      style={{ width: "32px", height: "32px" }}
                    />
                  </Button>
                </Tooltip>
              </Box>
            </>
          )}
        </Box>
      )}
    />
  );
}
