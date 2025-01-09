import React from 'react';
import {
  getCurrentDirectory,
  getParentPath,
} from '../DataFilesModalTables/DataFilesModalListingTable';

describe('DataFilesListingTable', () => {
  it('has utility functions', () => {
    expect(getCurrentDirectory).toBeDefined();
    expect(getParentPath).toBeDefined();
    expect(getCurrentDirectory('/path/to/directory')).toEqual('directory');
    expect(getParentPath('/path/to/file')).toEqual('/path/to');
  });
});
