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
// import BackupIcon from '@mui/icons-material/Backup';
// import MailIcon from '@mui/icons-material/Mail';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
// import DeleteIcon from "@mui/icons-material/Delete";
import { NavLink } from 'react-router-dom';
import AddHomeWorkIcon from '@mui/icons-material/AddHomeWork';

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
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250}}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <List >
      <ListItem key={'Project Management'} component={NavLink} to="/project-management" disablePadding>
            <ListItemButton>
              <ListItemIcon>
              <AddHomeWorkIcon />
              </ListItemIcon>
              <ListItemText primary={'Project Management'} />
            </ListItemButton>
          </ListItem>
          <ListItem key={'Data Dictionary Mapping'} component={NavLink} to="/match-manager" disablePadding>
            <ListItemButton>
              <ListItemIcon>
              <SearchIcon />
              </ListItemIcon>
              <ListItemText primary={'Data Dictionary Mapping'} />
            </ListItemButton>
          </ListItem>
          {/* <ListItem key={'Archived'} component={NavLink} to="/archived" disablePadding>
            <ListItemButton>
              <ListItemIcon>
              <DeleteIcon />
              </ListItemIcon>
              <ListItemText primary={'Archived'} />
            </ListItemButton>
          </ListItem> */}
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
            sx={{ zIndex: (theme) => theme.zIndex.appBar + 1000,}}
          >
            {list(anchor)}
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}
