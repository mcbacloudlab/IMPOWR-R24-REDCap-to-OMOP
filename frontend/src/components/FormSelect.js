import { useState, useEffect } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export default function FormSelect(props) {
  console.log("form select props", props);
  const [selectedForm, setSelectedForm] = useState("");

  //   const forms = ["bioinformatics_core_participants", "bioinformatics_core_activity_survey"];
  useEffect(() => {
    console.log("the prop select", props.forms[0]);
    console.log("typeof", typeof props.forms[0]);
    setSelectedForm(props.forms[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleChange = (event) => {
    console.log("handle change");
    setSelectedForm(event.target.value);
  };
  if (props.forms.length > 0) {
    return (
      <FormControl>
        <InputLabel id="select-form-label">Select a Form</InputLabel>
        <Select
          labelId="select-form-label"
          id="select-form"
          value={selectedForm || (props.forms && props.forms[0])} // add a null check before accessing the array
          onChange={handleChange}
        >
          {props.forms.map((form) => (
            <MenuItem key={form} value={form}>
              {form}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
}
