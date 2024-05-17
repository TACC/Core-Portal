import React, { useEffect, useState } from 'react';
import { Button, Icon } from '_common';
import styles from './ReorderUserList.module.scss'

const ReorderUserList = ({ users }) => {

    const [reorderedUsers, setReorderedUsers] = useState([]);

    useEffect(() => {
        const formattedUsers = users.map(user => user.user);
        setReorderedUsers(formattedUsers);
    }, [users]);


    const moveUp = (index) => {
        const reordered = [...reorderedUsers];
        const temp = reordered[index - 1];
        reordered[index - 1] = reordered[index];
        reordered[index] = temp;
        setReorderedUsers(reordered);
    };

    const moveDown = (index) => {
        const reordered = [...reorderedUsers];
        const temp = reordered[index + 1];
        reordered[index + 1] = reordered[index];
        reordered[index] = temp;
        setReorderedUsers(reordered);
    }

    return (
        <>
          {reorderedUsers.map((user, index) => (
            <div key={index} className={styles['user-div']}>
              <span className={styles['user-name']}>{user.last_name}, {user.first_name}</span>
              <div className={styles['button-group']}>
                <Button type='link' iconNameAfter='contract' disabled={index === 0} onClick={() => moveUp(index)} />
                <Button type='link' iconNameAfter='expand' disabled={index === users.length - 1} onClick={() => moveDown(index)} />
              </div>
            </div>
          ))}
        </>
      );
};

export default ReorderUserList;