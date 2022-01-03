import { getOperationText } from './DataFilesStatus';

describe('getOperationText', () => {
  it('converts operations to proper UI strings', () => {
    expect(getOperationText('mkdir')).toEqual('added');
    expect(getOperationText('rename')).toEqual('renamed');
    expect(getOperationText('upload')).toEqual('uploaded');
    expect(getOperationText('copy')).toEqual('copied');
    expect(getOperationText('trash')).toEqual('moved');
    expect(getOperationText('move')).toEqual('moved');
    expect(getOperationText('random_op')).toEqual('Unknown');
  });
});
