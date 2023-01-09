import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
// import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SearchIcon from '@mui/icons-material/Search';
// import MailIcon from '@mui/icons-material/Mail';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import DeleteIcon from "@mui/icons-material/Delete";
import { NavLink } from 'react-router-dom';

export default function TemporaryDrawer() {
  const [state, setState] = React.useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

  const toggleDrawer = (anchor, open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const list = (anchor) => (
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <List>
          {/* <ListItem key={'UMLS Search'} component={NavLink} to="/cde-project/umls-search" disablePadding>
            <ListItemButton>
              <ListItemIcon>
              <SearchIcon />
              </ListItemIcon>
              <ListItemText primary={'UMLS Search'} />
            </ListItemButton>
          </ListItem>
          <ListItem key={'Semantic Search'} component={NavLink} to="/cde-project/semantic-search" disablePadding>
            <ListItemButton>
              <ListItemIcon>
              <SearchIcon />
              </ListItemIcon>
              <ListItemText primary={'Semantic Search'} />
            </ListItemButton>
          </ListItem> */}
          <ListItem key={'Data Dictionary Mapping Manager'} component={NavLink} to="/redcap_omop/match-manager" disablePadding>
            <ListItemButton>
              <ListItemIcon>
              <SearchIcon />
              </ListItemIcon>
              <ListItemText primary={'Data Dictionary Mapping Manager'} />
            </ListItemButton>
          </ListItem>
          <ListItem key={'Archived'} component={NavLink} to="/redcap_omop/archived" disablePadding>
            <ListItemButton>
              <ListItemIcon>
              <DeleteIcon />
              </ListItemIcon>
              <ListItemText primary={'Archived'} />
            </ListItemButton>
          </ListItem>
      </List>
      <Divider />
    </Box>
  );

  return (
    <div>
      {['left'].map((anchor) => (
        <React.Fragment key={anchor}>
          {/* <Button > */}
          <IconButton
          onClick={toggleDrawer('left', true)}
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* </Button> */}
          <Drawer
            anchor={'left'}
            open={state[anchor]}
            onClose={toggleDrawer('left', false)}
          >
            {list(anchor)}
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}
