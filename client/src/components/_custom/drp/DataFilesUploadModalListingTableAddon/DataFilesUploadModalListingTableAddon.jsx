import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';
import styles from './DataFilesUploadModalListingTableAddon.module.scss';


const DataFilesUploadModalListingTableAddon = ({ file, onToggleAdvancedImageFile }) => {

    return (
        <>
            <span className={styles['span']}>
                <input
                    type="checkbox"
                    onChange={(e) => {
                        onToggleAdvancedImageFile(file.id, e.target.checked);
                    }}
                    className={styles['input']}
                />
                Advanced Image File
            </span>
        </>
    )
}

export default DataFilesUploadModalListingTableAddon;