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
      '.ts',
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
    type: 'Text',
    extensions: ['.err', '.log', '.out', '.txt']
  },
  {
    type: 'ZIP',
    extensions: ['.zip', '.tar', '.tar.gz', '.gz', '.tgz']
  },
  {
    type: '3D Visualization',
    extensions: [
      '.pov',
      '.vrml',
      '.webgl',
      '.x3d',
      '.x3db',
      '.pvd',
      '.ppvd',
      '.pwin',
      '.pvsm',
      '.vtk',
      '.vti',
      '.pvti',
      '.vts',
      '.pvts',
      '.vtr',
      '.vtp',
      '.STL',
      '.OBJ',
      '.FBX',
      '.COLLADA',
      '.3DS',
      '.IGES',
      '.STEP'
    ]
  }
];

export default fileTypes;
