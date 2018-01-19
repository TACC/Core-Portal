"""Logging setup
"""

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '[DJANGO] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'agave': {
            'format': '[AGAVE] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'metrics': {
            'format': '[METRICS] %(levelname)s %(module)s %(name)s.%(funcName)s:%(lineno)s:'
                      ' %(message)s user=%(user)s sessionId=%(sessionId)s op=%(operation)s'
                      ' info=%(info)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        },
        'file': {
            'level': 'DEBUG',
            'class':'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/portal.log',
            'maxBytes': 1024*1024*5, # 5 MB
            'backupCount': 5,
            'formatter':'default',
        },
        'metrics_console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'metrics',
        },
        'metrics_file': {
            'level': 'DEBUG',
            'class':'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/portal.log',
            'maxBytes': 1024*1024*5, # 5 MB
            'backupCount': 5,
            'formatter':'metrics',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'portal': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
        },
        'metrics': {
            'handlers': ['metrics_console', 'metrics_file'],
            'level': 'INFO',
        },
    },
}
