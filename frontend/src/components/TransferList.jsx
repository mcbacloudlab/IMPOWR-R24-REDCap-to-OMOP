import * as React from "react";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { useState, useEffect } from "react";

function not(a, b) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a, b) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

function union(a, b) {
  return [...a, ...not(b, a)];
}

export default function TransferList(props) {
  const [left, setLeft] = React.useState([]);
  const [right, setRight] = React.useState([]);
  const [checked, setChecked] = React.useState([]);
  //   const [headersToRemove, setHeadersToRemove] = useState();
  const [defaultHeaders, setDefaultHeaders] = useState();
  const [origData, setOrigData] = useState();
  const leftChecked = intersection(checked, left);
  const rightChecked = intersection(checked, right);
  let keepList = ["field_name", "form_name", "field_label"]
  useEffect(() => {
    setOrigData(props.data);
    setDefaultHeaders(props.colDefs);
    console.log('propscoldefs', props.colDefs)
    let headerList = props.colDefs.map((obj) => {
      return obj.header;
    });

    console.log('headerList', headerList)
    let leftArray = headerList.filter((header) => keepList.includes(header));
    let rightArray = headerList.filter((header) => !keepList.includes(header));
    console.log(leftArray); // ["field_name", "form_name", "field_label"]
    console.log(rightArray); // ["field_value", "created_at"]
    setLeft(leftArray);
    setRight(rightArray);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keysToRemove = right;

    if (origData) {
      const newDataArray = origData.map((object) => {
        const newObject = { ...object };
        keysToRemove.forEach((key) => delete newObject[key]);
        return newObject;
      });

      props.setData(newDataArray);
    }

    const headersToRemove = [];
    const headersToMatch = right;
    if (defaultHeaders) {
      const newArray = defaultHeaders.filter((object) => {
        if (headersToMatch.includes(object.header)) {
          headersToRemove.push(object);
          return false;
        }
        return true;
      });
      props.setColDefs(newArray);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right, defaultHeaders]);

  const handleToggle = (value) => () => {
    console.log('handle toggle', value)
    console.log('keeplist', keepList)
    if(keepList.includes(value)){
      console.log('in keep list')
      return
    }
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const numberOfChecked = (items) => intersection(checked, items).length;

  const handleToggleAll = (items) => () => {
    if (numberOfChecked(items) === items.length) {
      setChecked(not(checked, items));
    } else {
      setChecked(union(checked, items));
    }
  };

  const handleCheckedRight = () => {
    setRight(right.concat(leftChecked));
    setLeft(not(left, leftChecked));
    setChecked(not(checked, leftChecked));
  };

  const handleCheckedLeft = () => {
    setLeft(left.concat(rightChecked));
    setRight(not(right, rightChecked));
    setChecked(not(checked, rightChecked));
  };

  const customList = (title, items) => (
    <Card>
      <CardHeader
        sx={{ px: 2, py: 1 }}
        avatar={
          <Checkbox
            onClick={handleToggleAll(items)}
            checked={
              numberOfChecked(items) === items.length && items.length !== 0
            }
            indeterminate={
              numberOfChecked(items) !== items.length &&
              numberOfChecked(items) !== 0
            }
            disabled={items.length === 0}
            inputProps={{
              "aria-label": "all items selected",
            }}
          />
        }
        title={title}
        subheader={`${numberOfChecked(items)}/${items.length} selected`}
      />
      <Divider />
      <List
        sx={{
          width: "220px",
          height: "340px",
          bgcolor: "background.paper",
          overflow: "auto",
        }}
        dense
        component="div"
        role="list"
      >
        {items.map((value) => {
          const labelId = `transfer-list-all-item-${value}-label`;

          return (
            <ListItem
              key={value}
              role="listitem"
              button
              onClick={handleToggle(value)}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checked.indexOf(value) !== -1}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{
                    "aria-labelledby": labelId,
                  }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={`${value}`} />
            </ListItem>
          );
        })}
      </List>
    </Card>
  );

  return (
    <Grid container spacing={2} justifyContent="center" alignItems="center">
      <Grid item>{customList("Include", left)}</Grid>
      <Grid item>
        <Grid container direction="column" alignItems="center">
          <Button
            sx={{ my: 0.5 }}
            variant="outlined"
            size="small"
            onClick={handleCheckedRight}
            disabled={leftChecked.length === 0}
            aria-label="move selected right"
          >
            &gt;
          </Button>
          <Button
            sx={{ my: 0.5 }}
            variant="outlined"
            size="small"
            onClick={handleCheckedLeft}
            disabled={rightChecked.length === 0}
            aria-label="move selected left"
          >
            &lt;
          </Button>
        </Grid>
      </Grid>
      <Grid item>{customList("Remove", right)}</Grid>
    </Grid>
  );
}
