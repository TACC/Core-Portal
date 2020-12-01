const dataFilesEvent = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {
    response: {
      name: 'test2.png',
      uuid: '6685384534086062571-242ac112-0001-002',
      owner: 'sal',
      internalUsername: null,
      lastModified: '2020-12-01T14:18:50.816-06:00',
      source: 'test.png',
      path: 'test2.png',
      status: 'STAGING_COMPLETED',
      systemId: 'frontera.home.sal',
      nativeFormat: 'raw',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.test//test2.png'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.test'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/test'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/frontera.home.test//test2.png'
        }
      }
    }
  },
  message: '',
  operation: 'rename',
  pk: 51,
  read: false,
  status: 'SUCCESS',
  user: 'sal'
};

export default dataFilesEvent;
