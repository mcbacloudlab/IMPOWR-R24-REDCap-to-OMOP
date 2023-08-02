import { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import { styled } from "@mui/material/styles";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import Alert from "@mui/material/Alert";

export default function BasicTable(props) {
  const [lookUpDupe, setLookUpDupe] = useState(false);
  // console.log("basictable props", props);
  // console.log("table data props", props.data);
  let tableData;
  try {
    tableData = JSON.parse(props.umlsResults);
  } catch (error) {
    console.log("error", error);
  }

  const tableContainerStyle = {
    maxHeight: "calc(80% - 100px)", // Adjust this value based on the total height of other elements
    overflowY: "auto",
    marginTop: "15px",
  };

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));

  const PreferredCell = ({ row }) => {
    // console.log("row", row);
    return (
      <StyledTableCell>
        <Tooltip title="Set as preferred" placement="top">
          <Box sx={{ textAlign: "right" }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                verifyRow(row);
              }}
              sx={{
                textTransform: "capitalize",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                marginTop: "10px",
              }}
            >
              Prefer
            </Button>
          </Box>
        </Tooltip>
      </StyledTableCell>
    );
  };

  function verifyRow(row, removePref) {
    let newModalRowData = props.modalRowData;
    let newModalSubRowData = props.modalRowData.subRows;
    // const modifiedSubRows = newModalSubRowData;
    const modifiedSubRows = newModalSubRowData.filter(
      (object) => !object.lookup
    ); //remove existing lookups from
    setLookUpDupe(false);

    for (const obj of modifiedSubRows) {
      if (obj.snomedID === row.ui || newModalRowData.snomedID === row.ui) {
        // console.log("Found a matching object:", obj);
        setLookUpDupe(true);
        return;
      }
    }
    setLookUpDupe(false);
    let newSubRow = {
      redcapFieldLabel: props.modalRowData.redcapFieldLabel,
      extraData: { field_name: props.modalRowData.extraData.field_name },
      snomedText: row.name,
      snomedID: row.ui,
      selected: true,
      verified: true,
      lookup: true,
    };
    modifiedSubRows.push(newSubRow);
    // console.log("mod subrows", modifiedSubRows);

    // props.modalRowData.subRows = modifiedSubRows;
    // console.log("props modalrowsdata", props.modalRowData);
    const updatedModalRowData = {
      ...props.modalRowData,
      subRows: modifiedSubRows,
    };
    // console.log("update modal row data", updatedModalRowData);
    props.setModalRowData(updatedModalRowData);
    let tableData = props.tempAllData;
    // console.log('tableData', tableData)
    // console.log('updatedModalRowData', updatedModalRowData)
    const newArray = tableData.map((item) => {
      if (
        item.redcapFieldLabel === updatedModalRowData.redcapFieldLabel &&
        item.extraData.field_name === updatedModalRowData.extraData.field_name
      ) {
        return updatedModalRowData;
      }
      return item;
    });

    // console.log("new array", newArray);

    // console.log("before calling props buildtable data", newArray);
    props.buildTable(newArray, true, true);
    props.storeJobVerificationInfo(JSON.stringify(newArray));
    props.setLookupModalOpen(false);
    props.handleSetTempAllData(newArray);
    // props.showTab(null,true,props.selectedTabIdx)
    // console.log("newSubRow", newSubRow);
    props.verifyRow(newSubRow, false, true);
    //count and update selected and verified records
    newArray.map((item) => {
      return null;
    });
  }
  // console.log('tableDta', tableData)
  return (
    <>
      {lookUpDupe && (
        <Alert
          severity="error"
          sx={{
            fontSize: "1.2rem",
            maxWidth: "400px",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            This code already exists in the results.
          </Typography>
        </Alert>
      )}
      <TableContainer component={Paper} sx={tableContainerStyle}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <StyledTableCell>Name</StyledTableCell>
              <StyledTableCell align="right">Code</StyledTableCell>
              <StyledTableCell align="right">Root Source</StyledTableCell>
              <StyledTableCell align="right">Preferred</StyledTableCell>
            </TableRow>
          </TableHead>
          {tableData.length ? (
            <TableBody>
              {tableData.map((row) => (
                <StyledTableRow
                  key={row.name}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <StyledTableCell component="th" scope="row">
                    {row.name}
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {" "}
                    <Link
                      href={`https://uts.nlm.nih.gov/uts/umls/concept/${row.ui}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row.ui}
                    </Link>
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {row.rootSource}
                  </StyledTableCell>
                  <PreferredCell align="right" row={row} />
                </StyledTableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <StyledTableRow>
                <StyledTableCell>No Results</StyledTableCell>
              </StyledTableRow>
            </TableBody>
            
          )}
        </Table>
      </TableContainer>
    </>
  );
}
