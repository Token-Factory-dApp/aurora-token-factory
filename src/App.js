import { Navigate, Route, Routes } from "react-router-dom";
import MainNavigation from "./navigation/MainNavigation";
import Create from "./pages/Create";
import Home from "./pages/Home";
import Interact from "./pages/Interact";

function App() {
  return (
    <div className="App">
      <MainNavigation />
      <div className="main-container">
        <Routes>
          <Route path="/home" element={<Home />} exact />
          <Route path="/create" element={<Create />} exact />
          <Route path="/interact" element={<Interact />} exact />
          <Route
            path="/interact/:contractAddress"
            element={<Interact />}
            exact
          />
          <Route path="/" element={<Navigate replace to="/home" />} exact />
        </Routes>
      </div>
    </div>
  );
}

export default App;
