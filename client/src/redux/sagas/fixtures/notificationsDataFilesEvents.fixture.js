export const dataFilesRename = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {
    response: {
      name: 'test2.png',
      uuid: '6685384534086062571-242ac112-0001-002',
      owner: 'username',
      internalUsername: null,
      lastModified: '2020-12-01T14:18:50.816-06:00',
      source: 'http://129.114.97.130/test.png',
      path: 'test2.png',
      status: 'STAGING_COMPLETED',
      systemId: 'frontera.home.username',
      nativeFormat: 'raw',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username//test2.png'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/frontera.home.username//test2.png'
        }
      }
    }
  },
  message: '',
  operation: 'rename',
  pk: 51,
  read: false,
  status: 'SUCCESS',
  user: 'username'
};

export const dataFilesMove = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {
    response: {
      name: 'test.png',
      uuid: '6685384534086062571-242ac112-0001-002',
      owner: 'username',
      internalUsername: null,
      lastModified: '2020-12-01T14:18:50.816-06:00',
      source: 'http://129.114.97.130/test.png',
      path: 'testfol/test.png',
      status: 'STAGING_COMPLETED',
      systemId: 'frontera.home.username',
      nativeFormat: 'raw',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username//testfol/test.png'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/frontera.home.username//testfol/test.png'
        }
      }
    }
  },
  message: '',
  operation: 'move',
  pk: 51,
  read: false,
  status: 'SUCCESS',
  user: 'username'
};

export const dataFilesError = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {},
  message: '',
  operation: 'move',
  pk: 51,
  read: false,
  status: 'ERROR',
  user: 'username'
};

export const dataFilesCopy = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {
    response: {
      name: 'test.png',
      uuid: '6685384534086062571-242ac112-0001-002',
      owner: 'username',
      internalUsername: null,
      lastModified: '2020-12-01T14:18:50.816-06:00',
      source: 'http://129.114.97.130/test.png',
      path: 'testfol/test.png',
      status: 'STAGING_COMPLETED',
      systemId: 'frontera.home.username',
      nativeFormat: 'raw',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username//testfol/test.png'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/frontera.home.username//testfol/test.png'
        }
      }
    }
  },
  message: '',
  operation: 'copy',
  pk: 51,
  read: false,
  status: 'SUCCESS',
  user: 'username'
};

export const dataFilesTrash = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {
    response: {
      name: 'test_2020-11-19 20-54-46.png',
      uuid: '8699363006433792491-242ac112-0001-002',
      owner: 'username',
      internalUsername: null,
      lastModified: '2020-12-01T15:43:27.377-06:00',
      source:
        'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username//test.png',
      path: '.Trash/test_2020-11-19 20-54-46.png',
      status: 'STAGING_COMPLETED',
      systemId: 'frontera.home.username',
      nativeFormat: 'raw',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username//.Trash/test_2020-11-19%2020-54-46.png'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/frontera.home.username//.Trash/test_2020-11-19%2020-54-46.png'
        }
      }
    }
  },
  message: '',
  operation: 'trash',
  pk: 51,
  read: false,
  status: 'SUCCESS',
  user: 'username'
};

export const dataFilesMkdir = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {
    response: {
      name: 'testfol',
      uuid: '2102858593322724885-242ac112-0001-002',
      owner: 'username',
      internalUsername: null,
      lastModified: '2020-12-01T15:55:11.951-06:00',
      source: null,
      path: 'testfol',
      status: 'STAGING_COMPLETED',
      systemId: 'frontera.home.username',
      nativeFormat: 'dir',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username//testfol'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/frontera.home.username//testfol'
        }
      }
    }
  },
  message: '',
  operation: 'mkdir',
  pk: 51,
  read: false,
  status: 'SUCCESS',
  user: 'username'
};

export const dataFilesUpload = {
  action_link: '',
  datetime: '1606853930',
  deleted: false,
  event_type: 'data_files',
  extra: {
    response: {
      name: 'test.png',
      uuid: '3358364122233180651-242ac112-0001-002',
      owner: 'username',
      internalUsername: null,
      lastModified: '2020-12-01T15:57:19.318-06:00',
      source: 'http://129.114.97.130/test.png',
      path: 'test.png',
      status: 'STAGING_QUEUED',
      systemId: 'frontera.home.username',
      nativeFormat: 'raw',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username//test.png.png'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/frontera.home.username//test.png.png'
        },
        notification: []
      }
    }
  },
  message: '',
  operation: 'upload',
  pk: 51,
  read: false,
  status: 'SUCCESS',
  user: 'username'
};

export const dataFilesUploadToSharedWorkSpace = {
  event_type: 'data_files',
  datetime: '1614377685',
  status: 'SUCCESS',
  operation: 'upload',
  message: '',
  extra: {
    response: {
      name: 'test.txt',
      uuid: '610361652746916331-242ac112-0001-002',
      owner: 'username',
      internalUsername: null,
      lastModified: '2021-02-26T16:14:45.881-06:00',
      source: 'http://129.114.97.130/test7.txt',
      path: 'test7.txt',
      status: 'STAGING_QUEUED',
      systemId: 'test.site.project.PROJECT-3',
      nativeFormat: 'raw',
      _links: {
        self: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/media/system/test.site.project.PROJECT-3//test7.txt'
        },
        system: {
          href:
            'https://portals-api.tacc.utexas.edu/systems/v2/test.site.project.PROJECT-3'
        },
        profile: {
          href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
        },
        history: {
          href:
            'https://portals-api.tacc.utexas.edu/files/v2/history/system/test.site.project.PROJECT-3//test7.txt'
        },
        notification: []
      }
    }
  },
  pk: 1,
  action_link: '',
  user: 'username',
  read: true,
  deleted: false
};
