import { call, takeLatest, put } from 'redux-saga/effects';
import { fetchUtil } from 'utils/fetchUtil';
import React from 'react';
import { useSelector } from 'react-redux';

//Admin listing of all users
export async function fetchOnboardingAdminList() {
  const result = await fetchUtil({
    url: 'api/onboarding/admin/'
  });
  return result;
}

export function* getOnboardingAdminList() {
  yield put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_PROCESSING' });
  try{
    const adminList = yield call(fetchOnboardingAdminList);
    yield put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_SUCCESS', payload: adminList });
  } catch(error) {
    yield put({ type: 'FETCH_ONBOARDING_ADMIN_LIST_ERROR', payload: error });
  }
}

export function* watchOnboardingAdminList() {
  yield takeLatest('FETCH_ONBOARDING_ADMIN_LIST', getOnboardingAdminList);
}

//Admin list of a single user
/* export async function fetchOnboardingAdminIndividualUser() {
  const result = await fetchUtil({
    url: 'api/onboarding/user/username'
  });
  return result;
}

export function* getOnboardingAdminIndividualUser() {
  yield put({ type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_PROCESSING' });
  try {
    const onboardingUser = yield call(fetchOnboardingAdminIndividualUser);
    if (result.steps.state ='failed'){
      yield put({ type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_FAILED', payload: onboardingUser });
    } else {
      yield put({ type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_SUCCESS', payload: onboardingUser });
    }} catch (error) {
    yield put({ type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER_ERROR', payload: error });
  }
}

export function* watchOnboardingAdminIndividualUser() {
  yield takeLatest('FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER', getOnboardingAdminIndividualUser);
} */