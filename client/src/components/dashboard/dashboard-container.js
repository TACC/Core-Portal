// business logic
import React from 'react';
import PropTypes from "prop-types";


// ES6 Class Component
class Dashboard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
            userAllocations: {},
            currentUser: {},
            isLoaded: false,
        };
    }

    componentDidMount() {
        // this.authenticate();
        // this.allocations();
        fetch('/api/users/allocations/')
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        userAllocations: result,
                        isLoaded: true
                    });
                    return this.state.userAllocations;
                })
        fetch('/api/users/auth/')
            .then((resp) => {
                this.setState({
                    currentUser: resp,
                    isLoaded: true
                });
                return this.state.currentUser;
            })
    }

    allocations() {
        if (Object.entries(this.state.userAllocations).length) {
            return this.state.userAllocations;
        }
        fetch('/api/users/allocations/')
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        userAllocations: result,
                        isLoaded: true
                    });
                    return this.state.userAllocations;
                },
                (error) => {
                    this.setState({
                        error,
                        isLoaded: true
                    });
                }
            )
    }

    authenticate() {
        fetch('/api/users/auth/')
            .then((resp) => {
                this.setState({
                    currentUser: resp,
                    isLoaded: true
                });
                return this.state.currentUser;
            }, (err) => {
                return Promise.reject({ message: 'auth error' });
            });
    }

    render() {
        const { error, userAllocations, currentUser, isLoaded } = this.state;
        if (error) {
            return <div>Error: {error.message}</div>;
        } else if (Object.keys(userAllocations).length === 0 || Object.keys(currentUser).length === 0) {
            return <div>Loading...</div>;
        } else {
            return (
                <ul>
                    {Object.entries(userAllocations.allocs).forEach(([k, v]) => {
                        return (
                            <li key={k}>
                                {k}: {v}
                            </li>
                        )
                    })}
                </ul>
            );
        }
    }
}

export default Dashboard;
