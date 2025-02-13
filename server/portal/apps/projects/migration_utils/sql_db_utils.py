from django.db import connections

def run_query(query, params=None):
    with connections['drp_mysql'].cursor() as cursor:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

def query_projects():
    query = "SELECT * FROM dev.upload_project WHERE access = %s;"
    params = [2]
    return run_query(query, params)

def query_published_projects():
    query = "SELECT * FROM dev.upload_project WHERE access = %s;"
    params = [1]
    return run_query(query, params)

def get_project_by_id(project_id):
    query = "SELECT * FROM dev.upload_project WHERE id = %s;"
    params = [project_id]
    return run_query(query, params)

def query_related_publications(project_id):
    query = "SELECT * FROM dev.upload_publication WHERE project_id = %s;"
    params = [project_id]
    return run_query(query, params)

def query_authors(project_id):
    query = "SELECT * FROM dev.upload_collaborator WHERE project_id = %s;"
    params = [project_id]
    return run_query(query, params)

def query_user(user_id):
    query = "SELECT * FROM dev.upload_myuser WHERE id = %s;"
    params = [user_id]
    return run_query(query, params)

def query_samples(project_id):
    query = "SELECT * FROM dev.upload_sample WHERE project_id = %s;"
    params = [project_id]
    return run_query(query, params)

def query_origin_data(project_id, sample_id):
    query = "SELECT * FROM dev.upload_origin_data WHERE project_id = %s AND sample_id = %s;"
    params = [project_id, sample_id]
    return run_query(query, params)

def query_analysis_data(project_id):
    query = "SELECT * FROM dev.upload_analysis_data WHERE project_id = %s;"
    params = [project_id]
    return run_query(query, params)

def query_files(origin_data_id, analysis_data_id):
    if analysis_data_id is None:
        query = "SELECT * FROM dev.upload_datafile WHERE origin_data_id = %s AND analysis_data_id IS NULL;"
        params = [origin_data_id]
    elif origin_data_id is None:
        query = "SELECT * FROM dev.upload_datafile WHERE origin_data_id IS NULL AND analysis_data_id = %s;"
        params = [analysis_data_id]
    else:
        query = "SELECT * FROM dev.upload_datafile WHERE origin_data_id = %s AND analysis_data_id = %s;"
        params = [origin_data_id, analysis_data_id]
    return run_query(query, params)

def query_advanced_file_metadata(file_id):
    query = "SELECT * FROM dev.upload_advancedimagefile WHERE datafile_ptr_id = %s;"
    params = [file_id]
    return run_query(query, params)
