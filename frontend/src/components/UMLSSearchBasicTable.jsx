import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import { styled } from "@mui/material/styles";
import { Box, Button, IconButton, Typography, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function BasicTable(props) {
  console.log("basictable props", props);
  console.log('table data props', props.data)
  let tableData = JSON.parse(props.umlsResults);

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
    console.log("row", row);
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
    console.log("verifyRow", row);
    console.log('modal row data', props.modalRowData);
    let newModalSubRowData = props.modalRowData.subRows;
    const modifiedSubRows = newModalSubRowData.filter((object) => !object.lookup); //remove existing lookups from

    modifiedSubRows.push({
      redcapFieldLabel: props.modalRowData.redcapFieldLabel,
      extraData: {field_name: props.modalRowData.extraData.field_name},
      snomedText: row.name,
      snomedID: row.ui,
      selected: true,
      verified: true,
      lookup: true,
    });
    console.log("mod subrows", modifiedSubRows);

    // props.modalRowData.subRows = modifiedSubRows;
    console.log('props modalrowsdata', props.modalRowData);
    const updatedModalRowData = {
      ...props.modalRowData,
      subRows: modifiedSubRows
    }
    console.log('update modal row data', updatedModalRowData)
    props.setModalRowData(updatedModalRowData)
    let tableData = props.data;

    const newArray = tableData.map(item => {
      if (item.redcapFieldLabel === updatedModalRowData.redcapFieldLabel) {
        return updatedModalRowData;
      }
      return item;
    });

    console.log('new array', newArray)

    console.log("before calling props buildtable data", newArray);
    props.buildTable(newArray, true, true);
    props.storeJobVerificationInfo(JSON.stringify(newArray))

    //count and update selected and verified records
    newArray.map((item) => {
      
      return null
    })
  }

  return (
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
                <Link href={row.uri} target="_blank" rel="noopener noreferrer">
                  {row.ui}
                </Link>
              </StyledTableCell>
              <StyledTableCell align="right">{row.rootSource}</StyledTableCell>
              <PreferredCell align="right" row={row} />
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
