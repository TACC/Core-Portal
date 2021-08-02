const fileTypes = [
  {
    type: 'Audio',
    extensions: [
      '.aac',
      '.aifc',
      '.aiff',
      '.amr',
      '.au',
      '.flac',
      '.m4a',
      '.mp3',
      '.ogg',
      '.ra',
      '.wav',
      '.wma'
    ]
  },
  {
    type: 'Code',
    extensions: [
      '.c',
      '.css',
      '.h',
      '.haml',
      '.hh',
      '.htm',
      '.html',
      '.ini',
      '.java',
      '.js',
      '.json',
      '.jsx',
      '.j2',
      '.less',
      '.log',
      '.m',
      '.make',
      '.ml',
      '.mm',
      '.msg',
      '.ods',
      '.odt',
      '.odp',
      '.php',
      '.pl',
      '.properties',
      '.py',
      '.rb',
      '.rtf',
      '.sass',
      '.scala',
      '.scm',
      '.script',
      '.scss',
      '.sh',
      '.sml',
      '.sql',
      '.toml',
      '.txt',
      '.vi',
      '.vim',
      '.wpd',
      '.xml',
      '.xsd',
      '.xsl',
      '.yaml',
      '.yml'
    ]
  },
  {
    type: 'Documents',
    extensions: ['.doc', '.dot', '.docx', '.docm', '.dotx', '.dotm', '.docb']
  },
  {
    type: 'Folders'
  },
  {
    type: 'Images',
    extensions: [
      '.ai',
      '.bmp',
      '.gif',
      '.eps',
      '.jpeg',
      '.jpg',
      '.png',
      '.ps',
      '.psd',
      '.svg',
      '.tif',
      '.tiff',
      '.dcm',
      '.dicm',
      '.dicom',
      '.svs',
      '.tga'
    ]
  },
  {
    type: 'Jupyter Notebook',
    extensions: ['.ipynb']
  },
  {
    type: 'PDF',
    extensions: ['.pdf']
  },
  {
    type: 'Presentation',
    extensions: [
      '.ppt',
      '.pot',
      '.pps',
      '.pptx',
      '.pptm',
      '.potx',
      '.ppsx',
      '.ppsm',
      '.sldx',
      '.sldm'
    ]
  },
  {
    type: 'Spreadsheet',
    extensions: ['.xls', '.xlt', '.xlm', '.xlsx', '.xlsm', '.xltx', '.xltm']
  },
  {
    type: 'Shape File',
    /* https://desktop.arcgis.com/en/arcmap/10.3/manage-data/shapefiles/shapefile-file-extensions.htm */
    extensions: [
      '.shp',
      '.shx',
      '.dbf',
      '.sbn',
      '.sbx',
      '.fbn',
      '.fbx',
      '.ain',
      '.aih',
      '.atx',
      '.ixs',
      '.mxs',
      '.prj',
      '.xml',
      '.cpg'
    ]
  },
  {
    type: 'ZIP',
    extensions: ['.zip', '.tar', '.tar.gz', '.gz', '.tgz']
  }
];

export default fileTypes;
