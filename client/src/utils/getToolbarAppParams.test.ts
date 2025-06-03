import { getCompressParams } from './getCompressParams';
import { getExtractParams } from './getExtractParams';
import { TTapisFile } from './types';

describe('get toolbar app params util functions', () => {
  it('returns root for archive path when at root - compress', () => {
    let fileInputs: TTapisFile = {
      system: 'test',
      name: 'test.txt',
      path: 'test.txt',
      format: 'raw',
      type: 'file',
      mimeType: 'text/plain',
      lastModified: '',
      length: 122,
      permissions: '',
      api: 'tapis',
    };
    let paramOutputs = getCompressParams(
      [fileInputs],
      'test.txt',
      'zip',
      { id: 'compress', version: '0.0.4' },
      'test'
    );
    expect(paramOutputs['archiveSystemDir']).toEqual('.');
  });
  it('returns root for archive path when at root - extract', () => {
    let fileInputs: TTapisFile = {
      system: 'test',
      name: 'test.txt.zip',
      path: 'test.txt.zip',
      format: 'raw',
      type: 'file',
      mimeType: 'text/plain',
      lastModified: '',
      length: 122,
      permissions: '',
      api: 'tapis',
    };
    let paramOutputs = getExtractParams(
      fileInputs,
      { id: 'extract', version: '0.0.1' },
      {},
      'test'
    );
    expect(paramOutputs['archiveSystemDir']).toEqual('.');
  });
});
