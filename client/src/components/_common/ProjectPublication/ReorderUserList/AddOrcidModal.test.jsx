import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AddOrcidModal, {
  hasValidOrcidChecksum,
  validationSchema,
} from './AddOrcidModal';

const CHECKSUM_ERROR =
  'This ORCID ID has a typo: its last character does not match the rest';

describe('hasValidOrcidChecksum', () => {
  it.each([
    '0000-0002-1825-0097',
    '0000-0002-9079-593X',
    '0000-0002-9079-593x',
  ])('accepts %s', (value) => {
    expect(hasValidOrcidChecksum(value)).toBe(true);
  });

  it.each(['0000-0002-1825-0098', '0000-0002-9079-5930', '', undefined])(
    'rejects %s',
    (value) => {
      expect(hasValidOrcidChecksum(value)).toBe(false);
    }
  );
});

describe('validationSchema', () => {
  const errorFor = async (orcid_id) => {
    try {
      await validationSchema.validateAt('orcid_id', { orcid_id });
      return null;
    } catch (error) {
      return error.message;
    }
  };

  it('accepts a valid iD', async () => {
    expect(await errorFor('0000-0002-1825-0097')).toBeNull();
  });

  it('rejects a well-formed iD with the wrong check digit', async () => {
    expect(await errorFor('0000-0002-1825-0098')).toBe(CHECKSUM_ERROR);
  });

  it('reports only the format error for a malformed iD', async () => {
    expect(await errorFor('0000-0002')).toBe(
      'Enter a valid ORCID ID (e.g. 0000-0000-0000-0000)'
    );
  });
});

describe('AddOrcidModal', () => {
  const renderModal = (onSave = vi.fn()) => {
    render(
      <AddOrcidModal
        isOpen
        toggle={vi.fn()}
        author={{ first_name: 'Ada', last_name: 'Lovelace' }}
        onSave={onSave}
        onClear={vi.fn()}
      />
    );
    return onSave;
  };

  it('shows the checksum error as the iD is entered and does not save it', async () => {
    const user = userEvent.setup();
    const onSave = renderModal();

    await user.type(screen.getByRole('textbox'), '0000-0002-1825-0098');
    await user.tab();

    expect(await screen.findByText(CHECKSUM_ERROR)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a valid iD', async () => {
    const user = userEvent.setup();
    const onSave = renderModal();

    await user.type(screen.getByRole('textbox'), '0000-0002-9079-593x');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith('0000-0002-9079-593x')
    );
  });
});
