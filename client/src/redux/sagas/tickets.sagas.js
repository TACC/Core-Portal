import { put, takeLatest, call } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import 'cross-fetch';

function getLastEntry(history) {
  if (Array.isArray(history) && history.length > 0) {
    return history[history.length - 1];
  }
  return null;
}

export function* fetchTicketHistory(action) {
  yield put({ type: 'FETCH_TICKET_HISTORY' });
  const url = new URL(
    `/api/tickets/${action.payload.ticketId}/history`,
    window.location.origin
  );
  try {
    const res = yield call(fetch, url, { credentials: 'same-origin' });
    if (!res.ok) {
      yield put({
        type: 'FETCH_TICKET_HISTORY_ERROR',
        payload: 'Bad response from server'
      });
    } else {
      const json = yield res.json();
      const lastEntry = getLastEntry(json.ticket_history);
      if (lastEntry)
        yield put({
          type: 'TICKET_HISTORY_TOGGLE_SHOW_ITEM',
          payload: { index: Number(lastEntry.id) }
        });
      yield put({
        type: 'FETCH_TICKET_HISTORY_SUCCESS',
        payload: json.ticket_history
      });
    }
  } catch {
    yield put({
      type: 'FETCH_TICKET_HISTORY_ERROR',
      payload: 'Unknown error occurred'
    });
  }
}

export function* watchFetchTicketHistory() {
  yield takeLatest('GET_TICKET_HISTORY', fetchTicketHistory);
}

export function* postTicketReply(action) {
  const { ticketId } = action.payload;
  yield put({ type: 'POST_TICKET_HISTORY_REPLY_STARTED' });
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
        type: 'POST_TICKET_HISTORY_REPLY_FAILED',
        payload: 'Bad response from server'
      });
    } else {
      const json = yield res.json();
      yield put({
        type: 'TICKET_HISTORY_TOGGLE_SHOW_ITEM',
        payload: { index: Number(json.ticket_history_reply.id) }
      });
      yield put({
        type: 'POST_TICKET_HISTORY_REPLY_SUCCESS',
        payload: json.ticket_history_reply
      });
      action.payload.resetSubmittedForm();
    }
  } catch {
    yield put({
      type: 'POST_TICKET_HISTORY_REPLY_FAILED',
      payload: 'Unknown error occurred'
    });
  }
}

export function* watchPostTicketReply() {
  yield takeLatest('REPLY_TICKET_HISTORY', postTicketReply);
}
