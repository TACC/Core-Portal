import { http, HttpResponse } from 'msw';
import profileJson from './profileFixture.json';

export const handlers = [
  http.get('/accounts/api/profile/data', () => {
    return HttpResponse.json(profileJson);
  }),
];

export const profileHandlerWithGoogleDrive = http.get(
  '/accounts/api/profile/data',
  () => {
    return HttpResponse.json({
      ...profileJson,
      integrations: [
        {
          label: 'Google Drive',
          description: 'test description',
          activated: true,
          disconnect: 'https://disconnect.com',
          connect: 'https://google.com',
        },
      ],
    });
  }
);

export const profileHandlerWithIntegrationError = http.get(
  '/accounts/api/profile/data',
  () => {
    return HttpResponse.json({
      ...profileJson,
      integrations: [
        {
          label: 'Google Drive',
          description: 'test description',
          activated: true,
          disconnect: 'https://disconnect.com',
          connect: 'https://google.com',
          error: 'SETUP_ERROR',
        },
      ],
    });
  }
);

export const profileHandlerWithIntegration = http.get(
  '/accounts/api/profile/data',
  () => {
    return HttpResponse.json({
      ...profileJson,
      integrations: [
        {
          label: '3rd Party Service',
          description: '3rd Party Service description',
          activated: true,
        },
      ],
    });
  }
);

export const profileHandlerWithLicense = http.get(
  '/accounts/api/profile/data',
  () => {
    return HttpResponse.json({
      ...profileJson,
      licenses: [
        {
          current_user_license: true,
          license_type: 'MATLAB',
          class: 'portal.apps.licenses.MATLABLicense',
          details_html: 'portal/apps/licenses/matlab_details.html',
          template_html:
            '\u003Cp\u003E\n    \u003Ca class="btn-link" href="http://www.mathworks.com/" target="_blank"\u003EMathworks\' MATLAB \u003Ci class="fas fa-external-link-alt"\u003E\u003C/i\u003E\u003C/a\u003E\n    is available to Academic users in the Portal Applications Workspace but requires activation.\n\u003C/p\u003E\n\u003Cp\u003E\n     To request activation, please open a support ticket and Portal support will enable MATLAB for your account.\n\u003C/p\u003E\n',
        },
      ],
    });
  }
);
