import { put, takeLatest, call, all } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import { fetchUtil } from 'utils/fetchUtil';
import 'cross-fetch';

export function* fetchTickets(action) {
  yield put({ type: 'TICKET_LIST_FETCH_STARTED'
 });
  try {
    const res = yield call(fetchUtil, {
      url: `/api/tickets/`
    });
    yield put({
      type: 'TICKET_LIST_FETCH_SUCCESS',
      payload: res.tickets
    });
  } catch (error) {
    yield put({
      type: 'TICKET_LIST_FETCH_ERROR',
      payload: error
    });
  }
}

export function* watchTicketListFetch() {
  yield takeLatest('TICKET_LIST_FETCH', fetchTickets);
}

function getLastEntry(history) {
  if (Array.isArray(history) && history.length > 0) {
    return history[history.length - 1];
  }
  return null;
}

export function* showDetailedView(action) {
  yield put({
    type: 'TICKET_DETAILED_VIEW_INIT_MODAL',
    payload: { ticketId: action.payload.ticketId }
  });

  yield all([
    put({
      type: 'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT',
      payload: { ticketId: action.payload.ticketId }
    }),
    put({
      type: 'TICKET_DETAILED_VIEW_FETCH_HISTORY',
      payload: { ticketId: action.payload.ticketId }
    })
  ]);
}

export function* watchTicketDetailedView() {
  yield takeLatest('TICKET_DETAILED_VIEW_OPEN', showDetailedView);
}

export function* fetchTicketSubject(action) {
  yield put({ type: 'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT_STARTED' });
  try {
    const res = yield call(fetchUtil, {
      url: `/api/tickets/${action.payload.ticketId}`
    });
    yield put({
      type: 'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT_SUCCESS',
      payload: res.tickets[0].Subject
    });
  } catch (error) {
    yield put({
      type: 'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT_ERROR',
      payload: error
    });
  }
}

export function* watchTicketDetailedViewFetchSubject() {
  yield takeLatest(
    'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT',
    fetchTicketSubject
  );
}

export function* fetchTicketHistory(action) {
yield put({ type: 'TICKET_DETAILED_VIEW_FETCH_HISTORY_STARTED'
});
  try {
    const res = yield call(fetchUtil, {
      url: `/api/tickets/${action.payload.ticketId}/history`
    });
    const ticketHistory = res.ticket_history;
    const lastEntry = getLastEntry(ticketHistory);
    if (lastEntry)
      yield put({
        type: 'TICKET_DETAILED_VIEW_TOGGLE_SHOW_ITEM',
        payload: { index: Number(lastEntry.id) }
      });
    yield put({
      type: 'TICKET_DETAILED_VIEW_FETCH_HISTORY_SUCCESS',
      payload: ticketHistory
    });
  } catch (error) {
    yield put({
      type: 'TICKET_DETAILED_VIEW_FETCH_HISTORY_ERROR',
      payload: error
    });
  }
}

export function* watchTicketDetailedViewFetchHistory() {
  yield takeLatest('TICKET_DETAILED_VIEW_FETCH_HISTORY', fetchTicketHistory);
}

export function* postTicketReply(action) {
  const { ticketId } = action.payload;

  yield put({ type: 'TICKET_DETAILED_VIEW_REPLY_STARTED' });
  try {
    const res = yield call(fetch, `/api/tickets/${ticketId}/history`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken')
      },
      credentials: 'same-origin',
      body: action.payload.formData
    });
    if (!res.ok) {
      yield put({
        type: 'TICKET_DETAILED_VIEW_REPLY_FAILED',
        payload: 'Bad response from server'
      });
    } else {
      const json = yield res.json();
      yield put({
        type: 'TICKET_DETAILED_VIEW_TOGGLE_SHOW_ITEM',
        payload: { index: Number(json.ticket_history_reply.id) }
      });
      yield put({
        type: 'TICKET_DETAILED_VIEW_REPLY_SUCCESS',
        payload: json.ticket_history_reply
      });
      action.payload.resetSubmittedForm();

      /* ticket reply causes ticket status change so list of ticket needs to be updated */
      yield put({ type: 'TICKET_LIST_FETCH' });
    }
  } catch {
    yield put({
      type: 'TICKET_DETAILED_VIEW_REPLY_FAILED',
      payload: 'Unknown error occurred'
    });
  }
}

export function* watchPostTicketReply() {
  yield takeLatest('TICKET_DETAILED_VIEW_REPLY', postTicketReply);
}

export function* postTicketCreate(action) {
  yield put({
    type: 'TICKET_CREATE_STARTED'
  });

  try {
    const res = yield call(fetch, `/api/tickets/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken')
      },
      credentials: 'same-origin',
      body: action.payload.formData
    });
    const json = yield res.json();
    if (!res.ok) {
      yield put({
        type: 'TICKET_CREATE_FAILED',
        payload: json.message
      });
    } else {
      yield put({
        type: 'TICKET_CREATE_SUCCESS',
        payload: { ticketId: json.ticket_id }
      });
      action.payload.resetSubmittedForm();
      if (action.payload.refreshTickets) {
        yield put({ type: 'TICKET_LIST_FETCH' });
      }
    }
  } catch {
    yield put({
      type: 'TICKET_CREATE_FAILED',
      payload: 'Unknown error occurred'
    });
  }
}

export function* watchPostTicketCreate() {
  yield takeLatest('TICKET_CREATE', postTicketCreate);
}

export function* openTicketModal(action) {
  const sitekey = yield call(fetch, `/api/tickets/sitekey`, {
    method: 'GET',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    credentials: 'same-origin',
    body: action.payload
  });
  const jsonsitekey = yield sitekey.json();
  yield put({ type: 'TICKET_CREATE_INIT' });
  yield put({ type: 'TICKET_CREATE_SET_MODAL_OPEN', payload: { openTicketModal :action.payload, sitekey: jsonsitekey } });
}

export function* closeTicketModal(action) {
  yield put({ type: 'TICKET_CREATE_SET_MODAL_CLOSE' });
}

export function* watchTicketCreateOpenModal() {
  yield takeLatest('TICKET_CREATE_OPEN_MODAL', openTicketModal);
}

export function* watchTicketCreateCloseModal() {
  yield takeLatest('TICKET_CREATE_CLOSE_MODAL', closeTicketModal);
}
