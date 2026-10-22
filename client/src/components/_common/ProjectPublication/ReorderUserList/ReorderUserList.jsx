import React, { useState } from 'react';
import { Button, Icon } from '_common';
import AddOrcidModal from './AddOrcidModal';
import styles from './ReorderUserList.module.scss';

const ReorderUserList = ({ users, onReorder, onRemoveAuthor }) => {
  const [editingAuthorIndex, setEditingAuthorIndex] = useState(null);

  const closeOrcidModal = () => setEditingAuthorIndex(null);

  const saveOrcid = (orcid_id) => {
    const updated = [...users];
    updated[editingAuthorIndex] = {
      ...updated[editingAuthorIndex],
      orcid_id,
    };
    onReorder(updated);
    closeOrcidModal();
  };

  const clearOrcid = () => {
    const updated = [...users];
    const { orcid_id, ...rest } = updated[editingAuthorIndex];
    updated[editingAuthorIndex] = rest;
    onReorder(updated);
    closeOrcidModal();
  };

  const moveUp = (index) => {
    const reordered = [...users];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    onReorder(reordered);
  };

  const moveDown = (index) => {
    const reordered = [...users];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    onReorder(reordered);
  };

  return (
    <>
      <h3>Authors</h3>
      {users.map((user, index) => (
        <div key={index} className={styles['user-div']}>
          <span className={styles['user-name']}>
            {user.last_name}, {user.first_name}
          </span>
          <span className={styles['orcid-info']}>
            {user.orcid_id ? (
              <>
                (ORCID: {user.orcid_id}{' '}
                <Button
                  type="link"
                  onClick={() => setEditingAuthorIndex(index)}
                >
                  Edit
                </Button>
                )
              </>
            ) : (
              <Button type="link" onClick={() => setEditingAuthorIndex(index)}>
                Add ORCID ID
              </Button>
            )}
          </span>
          <div className={styles['button-group']}>
            <Button
              type="link"
              iconNameAfter="contract"
              disabled={index === 0}
              onClick={() => moveUp(index)}
            />
            <Button
              type="link"
              iconNameAfter="expand"
              disabled={index === users.length - 1}
              onClick={() => moveDown(index)}
            />
            {!user.isOwner && (
              <Button type="link" onClick={() => onRemoveAuthor(user)}>
                Remove Author
              </Button>
            )}
          </div>
        </div>
      ))}
      <AddOrcidModal
        isOpen={editingAuthorIndex !== null}
        toggle={closeOrcidModal}
        author={editingAuthorIndex !== null ? users[editingAuthorIndex] : null}
        onSave={saveOrcid}
        onClear={clearOrcid}
      />
    </>
  );
};

export default ReorderUserList;
