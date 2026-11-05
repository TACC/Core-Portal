import { vi } from 'vitest';
import renderComponent from 'utils/testing';
import { act, screen, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import DataFilesProjectMembers from './DataFilesProjectMembers';
const mockStore = configureStore();
import userEvent from '@testing-library/user-event';

const systemConfig = {
  name: 'Project',
  scheme: 'projects',
  api: 'tapis',
  icon: 'publications',
  readOnly: false,
  hideSearchBar: false,
  defaultProject: true,
  system: 'cep.project.root',
  rootDir: '/corral-repl/tacc/aci/CEP/projects',
  resourceProvider: 'TACC',
};

describe('DataFilesProjectMembers', () => {
  beforeEach(() => {
    // shouldAdvanceTime advances mocked timers alongside the system clock
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('member search displays result after debounce', async () => {
    const { container } = renderComponent(
      <DataFilesProjectMembers
        projectId="1234"
        members={[]}
        onAdd={() => {}}
        onRemove={() => {}}
      />,
      mockStore({
        systems: { storage: { configuration: [systemConfig] } },
      })
    );

    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTimeAsync,
    });

    // Type a query into the user input
    const userInput = await screen.findByRole('combobox');
    await user.type(userInput, 'sam');

    // Wait for input debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(750);
    });

    await waitFor(() => {
      const userOption = container.querySelector(
        '#user-search-list option[value="Sam Smunstermann (sam@munster.mann)"]'
      );
      expect(userOption).toBeInTheDocument();
    });
  });
});
