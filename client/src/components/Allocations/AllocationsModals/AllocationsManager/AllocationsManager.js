import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  ModalHeader,
  ModalBody,
  Table,
  InputGroup,
  InputGroupAddon,
  Input,
  Button,
  Label,
  FormGroup
} from 'reactstrap';

const AllocationsManager = ({ isOpen, toggle, pid, prjName }) => {
  const { teams, loadingUsernames } = useSelector(state => state.allocations);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setResults] = React.useState([]);
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      console.log(searchTerm);
      // Send Axios request hereif (e.target.value)
      if (searchTerm)
        fetch(`/api/users/search/?field=lastName&q=${searchTerm}`)
          .then(resp => resp.json())
          .then(data => {
            setResults(data.response);
            console.log(data);
          });
    }, 3000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);
  const isLoading = loadingUsernames[pid] && loadingUsernames[pid].loading;
  const getRole = role => {
    switch (role) {
      case 'PI':
        return 'Principal Investigator';
      case 'Delegate':
        return 'Allocation Manager';
      default:
        return 'Member';
    }
  };
  const removeHandler = username => {
    dispatch({
      type: 'MANAGE_TEAMS',
      params: {
        flag: 'DELETE',
        projectId: pid,
        username,
        projectName: prjName
      }
    });
  };
  const addUserHandler = username => {
    dispatch({
      type: 'MANAGE_TEAMS',
      params: {
        flag: 'ADD',
        projectId: pid,
        username,
        projectName: prjName
      }
    });
  };
  /**
   *
   * @param {Event} e
   */
  const handleChange = async e => {
    setSearchTerm(e.target.value);
  };
  const Results = () => {
    const handleAdd = () => {
      console.log('click');
    };
    return (
      <datalist id="datalist">
        {searchResults.map(el => (
          <option onClick={() => addUserHandler(el.username)} key={el.username}>
            {el.firstName} {el.username} {el.email}
          </option>
        ))}
      </datalist>
    );
  };
  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader>Manage Team</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label>Add Member</Label>
          <InputGroup>
            <InputGroupAddon addonType="prepend">
              <Button onClick={() => addUserHandler('tastest1')}>Add</Button>
            </InputGroupAddon>
            <Input list="datalist" value={searchTerm} onChange={handleChange} />
            {!!searchResults.length && <Results />}
          </InputGroup>
        </FormGroup>
        {isLoading ? (
          'LOADING'
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Members</th>
                <th>Role</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {teams[pid] &&
                teams[pid].map(el => (
                  <tr key={el.username}>
                    <td>{`${el.firstName} ${el.lastName}`}</td>
                    <td>{getRole(el.role)}</td>
                    <td>
                      {el.role === 'Standard' && (
                        <Button
                          color="link"
                          onClick={() => removeHandler(el.username)}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}
      </ModalBody>
    </Modal>
  );
};
AllocationsManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  pid: PropTypes.number.isRequired
};
export default AllocationsManager;
