import doesClassExist from './doesClassExist';

const mockStylesheet = `
.icon-upload:before {
    content: "\\ea57"
}

.icon-user-reverse:before {
    content: "\\ea58"
}

.icon-user:before {
    content: "\\ea59"
}

.icon-visualization:before {
    content: "\\ea5a"
}

.icon-zoom-in:before {
    content: "\\ea5b"
}

.icon-zoom-out:before {
    content: "\\ea5c"
}
`;

describe('doesClassExist', () => {
  it('should return true for existing class in string stylesheet', async () => {
    const result = doesClassExist('icon-visualization', [mockStylesheet]);
    expect(result).toBe(true);
  });

  it('should return false for non-existing class in string stylesheet', async () => {
    const result = doesClassExist('icon-nonexistent', [mockStylesheet]);
    expect(result).toBe(false);
  });

  it('should return true for existing class in object stylesheet', async () => {
    const mockStylesheetObject = {
      'icon-visualization': true,
    };
    const result = doesClassExist('icon-visualization', [mockStylesheetObject]);
    expect(result).toBe(true);
  });

  it('should return false for non-existing class in object stylesheet', async () => {
    const mockStylesheetObject = {
      'icon-visualization': true,
    };
    const result = doesClassExist('icon-nonexistent', [mockStylesheetObject]);
    expect(result).toBe(false);
  });
});
