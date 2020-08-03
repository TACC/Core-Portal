import { put, takeLatest, call, all, select } from 'redux-saga/effects';
import 'cross-fetch';
import { fetchUtil } from 'utils/fetchUtil';

// TODO: Optimize this
function sortAppMetaUtil(payload) {
  // looks for string in app's tag array
  function tagIncludesParam(definition, param) {
    return (
      definition.tags &&
      Array.isArray(definition.tags) &&
      definition.tags.filter(s => s.includes(`${param}:`))[0] &&
      definition.tags.filter(s => s.includes(`${param}:`))[0].split(':')[1]
    );
  }
  const categoryDict = {};

  payload.forEach(meta => {
    const appMeta = meta;

    // Parse app icon from tags
    const appIcons = ['Jupyter'];
    if (tagIncludesParam(appMeta.value.definition, 'appIcon')) {
      const appIcon = appMeta.value.definition.tags
        .filter(s => s.includes('appIcon'))[0]
        .split(':')[1];

      // Use icon for binning of apps, with '_icon-letter' appended to denote the icon will be a letter, not a true icon
      // appMeta.value.definition.appIcon = `${appIcon}_icon-letter`;

      // Overwrite icon string with correct formatting if icon is in supported appIcons list
      appIcons.some(icon => {
        if (appIcon.toLowerCase().includes(icon.toLowerCase())) {
          appMeta.value.definition.appIcon = icon.toLowerCase();
          return true;
        }
        return false;
      });

      // If icon not in tags, try to match label to tag
    } else {
      appIcons.some(icon => {
        if (
          appMeta.value.definition.label
            .toLowerCase()
            .includes(icon.toLowerCase())
        ) {
          appMeta.value.definition.appIcon = icon;
          return true;
        }
        return false;
      });
    }

    // find appCategory in app def tags; assign appCategory to meta and sort into category bins
    let category;
    if (appMeta.value.definition.isPublic) {
      if (tagIncludesParam(appMeta.value.definition, 'appCategory')) {
        [, category] = appMeta.value.definition.tags
          .filter(s => s.includes('appCategory'))[0]
          .split(':');
      }
      if (!category) {
        category = 'Uncategorized';
      }
    } else {
      category = 'My Apps';
    }

    appMeta.value.definition.appCategory = category;
    if (category in categoryDict) {
      categoryDict[category].push(appMeta);
    } else {
      categoryDict[category] = [appMeta];
    }
  });

  /* Bin applications where multiple apps share the same icon, e.g. Matlab */
  const categories = {};
  const binMap = {};
  const appDict = {};

  /* Loop through apps categorized into lists to create sublists of binned apps */
  Object.entries(categoryDict).forEach(([appCategory, contents]) => {
    categories[appCategory] = categories[appCategory] || [];
    binMap[appCategory] = binMap[appCategory] || [];
    const bins = {};
    contents.forEach(appMeta => {
      if (appMeta.value.definition.appIcon) {
        const { appIcon } = appMeta.value.definition;
        const map = { binned: true, ...appMeta };
        bins[appIcon] = bins[appIcon]
          ? bins[appIcon].concat(map)
          : (bins[appIcon] = [map]);
      }
    });

    /* Remove bins with only one app */
    Object.entries(bins).forEach(([k, v]) => {
      if (v.length === 1) {
        delete bins[k];
      }
    });

    /* For each binned app type, create a psuedo appMeta to store app tile information in the app tray
                and the binned app list */

    // binMeta tracks if this bin exists for this category yet
    const binMeta = {};
    contents.forEach(meta => {
      const appMeta = meta;
      // if multiple of this app's appIcon exist (stored in bins object), create and add pseudo meta to master dict of category app lists
      if (
        bins[appMeta.value.definition.appIcon] &&
        !binMeta[appMeta.value.definition.appIcon]
      ) {
        const icon = appMeta.value.definition.appIcon.replace(
          '_icon-letter',
          ''
        );
        const pseudoMeta = {
          applications: bins[appMeta.value.definition.appIcon],
          value: {
            definition: {
              appIcon: appMeta.value.definition.appIcon.includes('_icon-letter')
                ? null
                : appMeta.value.definition.appIcon,
              label: icon,
              id: `${icon}::${appCategory}`
            }
          }
        };

        categories[appCategory].push(pseudoMeta);
        binMeta[appMeta.value.definition.appIcon] = true;

        // Create list of dictionaries pointing to the index of each bin in the tab
        binMap[appCategory][appMeta.value.definition.appIcon] = categories[
          appCategory
        ].indexOf(pseudoMeta);

        // else app is not binned, add to master list by category
      } else {
        // If icon is an icon-letter, delete icon
        if (
          appMeta.value.definition.appIcon &&
          appMeta.value.definition.appIcon.includes('_icon-letter')
        ) {
          delete appMeta.value.definition.appIcon;
        }
        categories[appCategory].push(appMeta);
      }
      appDict[appMeta.value.definition.id] = appMeta;
    });
  });

  /* Create an appIcons dictionary */
  const appIcons = {};
  Object.keys(categoryDict).forEach(category => {
    categoryDict[category].forEach(app => {
      const { definition } = app.value;
      if ('appIcon' in definition) {
        appIcons[definition.id] = definition.appIcon;
      }
    });
  });

  /* Create a categoryIcons dictionary */
  const categoryIcons = {};
  Object.keys(categoryDict).forEach(category => {
    // HACK: Creating just enough data for category icons to exist
    // RFC: Should a proper category definition object exist?
    const supportedIcons = ['Data Processing', 'Visualization', 'Simulation'];
    if (supportedIcons.includes(category)) {
      categoryIcons[category] = category.toLowerCase().replace(' ', '-');
    }
  });

  return { appDict, categoryDict, appIcons, categoryIcons };
}

function* getApps() {
  yield put({ type: 'GET_APPS_START' });
  try {
    const [privateResp, metaResp] = yield all([
      call(fetchUtil, {
        url: '/api/workspace/apps',
        params: { private: true }
      }),
      call(fetchUtil, { url: '/api/workspace/meta' })
    ]);
    // combine apps with metadata and private non-cloned apps into single list
    const json = [
      ...privateResp.response.filter(
        app => app.id.toLowerCase().startsWith('prtl.clone') === false
      ),
      ...metaResp.response.listing
    ].map(meta => {
      let appMeta = meta;

      // fake meta for private apps with no metadata record
      if (!('value' in appMeta) && 'id' in appMeta) {
        appMeta = {
          value: {
            definition: appMeta,
            type: 'agave'
          }
        };
      }

      // If label is undefined, set as id
      if (!appMeta.value.definition.label) {
        appMeta.value.definition.label = appMeta.value.definition.id;
      }

      return appMeta;
    });
    const data = yield sortAppMetaUtil(json);
    yield put({
      type: 'GET_APPS_SUCCESS',
      payload: { ...data, defaultTab: metaResp.response.default_tab }
    });
  } catch (error) {
    yield put({ type: 'GET_APPS_ERROR', payload: error });
  }
}

const getCurrentApp = state => state.app;

function* getApp(action) {
  const { appMeta, appId } = action.payload;
  const currentApp = yield select(getCurrentApp);
  if (currentApp.definition.id === appId) {
    return;
  }
  yield put({ type: 'FLUSH_SUBMIT' });
  yield put({ type: 'GET_APP_START' });
  if (appMeta && appMeta.value.type === 'html') {
    yield put({
      type: 'LOAD_APP',
      payload: appMeta
    });
  } else {
    try {
      const res = yield call(fetchUtil, {
        url: '/api/workspace/apps',
        params: { app_id: appId }
      });
      yield put({ type: 'LOAD_APP', payload: res.response });
    } catch (error) {
      yield put({ type: 'GET_APP_ERROR', payload: error });
    }
  }
}

export default function* watchApps() {
  yield takeLatest('GET_APPS', getApps);
  yield takeLatest('GET_APP', getApp);
}
