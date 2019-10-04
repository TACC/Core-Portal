// business logic
import React from 'react';
import PropTypes from "prop-types";

class Dashboard extends React.Component {
  _isMounted = false;

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
    this._isMounted = true;
    // this.authenticate();
    // this.allocations();
    fetch('/api/users/allocations/')
      .then(res => res.json())
      .then(
        (result) => {
          if (this._isMounted) {
            this.setState({
              userAllocations: result,
              isLoaded: true
            });
            console.log(this.state);
          }
        })
    fetch('/api/users/auth/')
      .then((resp) => {
        this.setState({
          currentUser: resp,
          isLoaded: true
        });
      })
  }

  componentWillUnmount() {
    this._isMounted = false;
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

  allocList(allocs) {
    let alloclist;
    if ('allocs' in allocs) {
      alloclist = Object.entries(allocs.allocs).forEach(([k, v]) => {
        <li key={k}>
          {k}: {v}
        </li>
      })

    }
    return alloclist;
  }

  render() {
    console.log('render called');
    const { error, userAllocations, currentUser, isLoaded } = this.state;

    return (
      <div>
        {this.allocList(userAllocations)}
        {
          this.state && Object.keys(userAllocations).length !== 0 &&
          <ul>
            <li>allocs!</li>
            {/* {this.allocList(userAllocations.allocs)} */}
            {Object.entries(userAllocations.allocs).forEach(([k, v]) => {
              return (
                <li key={k}>
                  {k}: {v}
                </li>
              )
            })}
          </ul>
        }
      </div>
    )
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
