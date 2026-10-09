import { drpMetadataValidate } from './DataFilesProjectPublish';

const complete = {
  title: 'Dataset',
  description: 'A description',
  cover_image: 'cover.png',
  license: 'ODC-BY 1.0',
};

describe('drpMetadataValidate', () => {
  it('passes complete metadata', () => {
    expect(drpMetadataValidate(complete)).toEqual({});
  });

  it.each([undefined, ''])('requires a license (%s)', (license) => {
    expect(drpMetadataValidate({ ...complete, license })).toEqual({
      license: 'License is required',
    });
  });

  it('reports every missing field', () => {
    expect(Object.keys(drpMetadataValidate({}))).toEqual([
      'title',
      'description',
      'cover_image',
      'license',
    ]);
  });
});
