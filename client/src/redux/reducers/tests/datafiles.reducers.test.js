import {
  systems as datafilesReducer,
  initialSystemState,
} from '../datafiles.reducers';
import systemDefinitionFixture from '../../sagas/fixtures/systemDefinition.fixture';

describe('Datafiles Reducer', () => {
  test('Load initial state', () => {
    expect(datafilesReducer(initialSystemState, { type: undefined })).toEqual(
      initialSystemState
    );
  });
  test('Add system definition to state', () => {
    const addSystemDefinitionAction = {
      type: 'FETCH_SYSTEM_DEFINITION_SUCCESS',
      payload: systemDefinitionFixture,
    };
    expect(
      datafilesReducer(initialSystemState, addSystemDefinitionAction)
    ).toEqual({
      ...initialSystemState,
      definitions: {
        ...initialSystemState.definitions,
        list: [systemDefinitionFixture],
        error: false,
        errorMessage: null,
        loading: false,
      },
    });
  });
});
