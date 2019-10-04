// stateless view Component.
import React from "react";
import ReactDOM from "react-dom";
import Dashboard from "./dashboard-container";
// import Table from "./table";
const App = () => (
    <Dashboard />
);
const wrapper = document.getElementById("root");
wrapper ? ReactDOM.render(<App />, wrapper) : null;
