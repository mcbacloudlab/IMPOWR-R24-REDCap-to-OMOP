// import logo from './logo.svg';
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SearchAppBar from "./components/SearchAppBar";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MatchManager from "./pages/MatchManager";
import Archived from "./pages/Archived";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <header className="App-header">
          <BrowserRouter>
            <div>
              <SearchAppBar />
              <Routes>
                <Route path="/" element={<MatchManager></MatchManager>} exact />
                <Route
                  path="/match-manager"
                  element={<MatchManager></MatchManager>}
                  exact
                />
                <Route path="/archived" element={<Archived></Archived>} exact />
                <Route path="/signin" element={<SignInPage></SignInPage>} exact />
                <Route path="/signup" element={<SignUpPage></SignUpPage>} exact />
                <Route component={Error} />
              </Routes>
            </div>
          </BrowserRouter>
        </header>
      </div>
    </ThemeProvider>
  );
}

export default App;
