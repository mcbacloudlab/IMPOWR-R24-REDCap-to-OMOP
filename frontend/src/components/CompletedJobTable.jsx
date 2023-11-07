import React, { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import MaterialReactTable from "material-react-table";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Typography,
} from "@mui/material";
// import StorageIcon from "@mui/icons-material/Storage";
import { useLists } from "./ListsContext";
import CSVIcon from "../assets/csv.png";

export default function CompletedJobTable({
  columns,
  data,
  setSorting,
  handleExportData,
  updateDD,
  selectedTabIdx,
  setData,
}) {
  // const [isValidChecked, setIsValidChecked] = useState(false);
  const { isValidChecked, setIsValidChecked } = useLists();

  const allData = useRef(data);

  useEffect(() => {
    if (isValidChecked) {
      setData(filterByDate(data));
    }
  }, [data, isValidChecked, setData]);


  function handleValidChecked(event) {
    console.log("event", event);
    setIsValidChecked(event);

    console.log("data", data);
    if (event) {
      console.log("filterData", filterByDate(data));
      setData(filterByDate(data));
    } else {
      setData(allData.current);
    }
  }

  function filterByDate(records) {
    const today = new Date();

    // Check if the date range in extraData includes today's date
    const isDateValid = (extraData) => {
      const startDate = new Date(extraData.valid_start_date);
      const endDate = new Date(extraData.valid_end_date);
      return startDate <= today && today <= endDate;
    };

    // Recursive function to filter out records based on valid dates
    const filterRecords = (arr) => {
      return arr.reduce((acc, record) => {
        // First filter the subRows, if they exist
        const validSubRows = (record.subRows || []).filter((subRow) =>
          isDateValid(subRow.extraData)
        );

        // Check if the main record is valid
        if (isDateValid(record.extraData)) {
          // If valid, keep the record and its valid subRows
          acc.push({ ...record, subRows: validSubRows });
        } else if (validSubRows.length > 0) {
          // If the main record is invalid, promote the first valid subRow
          const [firstValidSubRow, ...remainingSubRows] = validSubRows;
          acc.push({ ...firstValidSubRow, subRows: remainingSubRows });
        }
        // If the main record is invalid and has no valid subRows, it is omitted

        return acc;
      }, []);
    };

    return filterRecords(records);
  }

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
          maxHeight: "60vh",
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
          <Tooltip title="Check this if you only want to include valid Athena terms using the valid start and end dates">
            <FormControlLabel
              control={
                <Checkbox
                  checked={isValidChecked}
                  onChange={(e) => handleValidChecked(!isValidChecked)}
                  color="primary"
                />
              }
              label="Only Include Valid Terms"
            />
          </Tooltip>
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

              <Box
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: "auto",
                }}
              >
                <Tooltip
                  title={`This is the CSV file you can use with the desktop companion app.`}
                  placement="top"
                >
                  <Button onClick={() => handleExportData("downloadExcel")}>
                    <img
                      src={CSVIcon}
                      alt="Export to CSV"
                      style={{ width: "32px", height: "32px" }}
                    />
                  </Button>
                </Tooltip>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    textAlign: "center",
                    marginTop: "4px",
                  }}
                >
                  OMOP <br />
                  Companion File
                </Typography>

                <Tooltip
                  title={`You could also upload this data dictionary back into your REDCap. 
          If you choose to upload this to your REDCap be aware this will overwrite the field_annotations in REDCap with the data used here.`}
                  placement="top"
                >
                  <Button onClick={() => handleExportData("downloadUpload")}>
                    <img
                      src={CSVIcon}
                      alt="Export to CSV"
                      style={{ width: "32px", height: "32px" }}
                    />
                  </Button>
                </Tooltip>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    textAlign: "center",
                    marginTop: "4px",
                  }}
                >
                  Data Dictionary <br />
                  Upload File
                </Typography>
              </Box>
            </>
          )}
        </Box>
      )}
    />
  );
}
