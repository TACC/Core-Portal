import React, { useEffect, useState } from 'react';
import { Button, Icon } from '_common';
import styles from './ProjectMembersList.module.scss';

const ProjectMembersList = ({ members, onAddCoAuthor }) => {
  return (
    <>
      <h3>Other Authors</h3>
      {members.map((member, index) => (
        <div key={index} className={styles['user-div']}>
          <span className={styles['user-name']}>
            {member.last_name}, {member.first_name}
          </span>
          <div className={styles['button-group']}>
            <Button type="link" onClick={() => onAddCoAuthor(member)}>
              Add Author
            </Button>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProjectMembersList;
