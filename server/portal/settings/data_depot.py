"""Data Depot settings"""

PORTAL_DATA_DEPOT_MANAGERS = {
    'my-data': 'portal.apps.data_depot.managers.private_data.FileManager',
    'shared': 'portal.apps.data_depot.managers.shared.FileManager',
}
PORTAL_DATA_DEPOT_PAGE_SIZE = 100

TOOLBAR_OPTIONS = {
    'trash_enabled': True,
    'share_enabled': True,
    'preview_enabled': True,
    'preview_images_enabled': True,
    'copy_enabled': True,
    'move_enabled': True,
    'rename_enabled': True,
    'tag_enabled': True,
}
