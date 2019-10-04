import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Allocations from '../../components/allocations'
import Sidebar from '../../components/sidebar'

function DataFiles() {
    return <h2>DataFiles</h2>;
}

function Applications() {
    return <h2>Applications</h2>;
}

function Publications() {
    return <h2>Publications</h2>;
}

function Dashboard() {
    return <h2>Dashboard</h2>;
}

function Workbench({ match }) {
    return (
        <div className="wrapper">
            <div className="sideNav">
                <Sidebar />
            </div>
            <div className="workbench-content">
                <Switch>
                    <Route path={`${match.path}/allocations`}>
                        <Allocations />
                    </Route>
                    <Route path={`${match.path}/dashboard`} component={Dashboard} />
                    <Route path={`${match.path}/publications`} component={Publications} />
                    <Route path={`${match.path}/applications`} component={Applications} />
                    <Route path={`${match.path}/data`} component={DataFiles} />
                </Switch>
            </div>
        </div>
    )
}

function AppRouter() {
    return (
        <Router>
            <div>
                <Switch>
                    <Route
                        path='/workbench'
                        render={(props) => <Workbench {...props} />}
                    />
                </Switch>
            </div>
        </Router>
    );
}

export default AppRouter;
