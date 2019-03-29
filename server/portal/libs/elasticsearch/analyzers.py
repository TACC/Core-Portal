"""
.. module: portal.lis.elasticsearch.analyzers
   :synopsis: Elastic Search Analyzers
"""
from __future__ import unicode_literals, absolute_import
import logging
from elasticsearch_dsl import analyzer, token_filter, tokenizer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

path_analyzer = analyzer('path_analyzer',
                         tokenizer=tokenizer('path_hierarchy'))

file_analyzer = analyzer('file_analyzer',
                         tokenizer=tokenizer('trigram', 'nGram', min_gram=2, max_gram=20),
                         filter='lowercase')

file_query_analyzer_short = analyzer('file_query_analyzer_short',
                               tokenizer='keyword', filter='lowercase')

file_query_analyzer_long = analyzer('file_query_analyzer_long',
                               tokenizer=tokenizer('20gram', 'nGram', min_gram=20, max_gram=20), 
                               filter='lowercase')

file_pattern_analyzer = analyzer('file_ext_analyzer',
                        tokenizer=tokenizer('file_pattern', 'pattern', pattern='\\.'),
                        filter='lowercase')

reverse_file_analyzer = analyzer('file_reverse', 
                        tokenizer=tokenizer('keyword'),
                        filter=['lowercase', 'reverse'])