import pydantic
import pytest

from portal.apps.projects.schema_models.base_metadata import FileColumn, FileObj


def test_file_obj_dumps_croissant_fields_under_the_keys_the_landing_page_reads():
    """public_data/views.py builds `distribution`/`recordSet` from the stored dicts, reading
    `sha256` and each column's camelCase `dataType` -- so the serialized keys must match."""
    file_obj = FileObj(
        system="test.project.published.test.project-1",
        name="data.csv",
        path="/data.csv",
        type="file",
        sha256="a" * 64,
        columns=[FileColumn(name="porosity", data_type="sc:Float"), FileColumn(name="label")],
    )

    dumped = file_obj.model_dump()

    assert dumped["sha256"] == "a" * 64
    assert dumped["columns"] == [
        {"name": "porosity", "dataType": "sc:Float"},
        {"name": "label", "dataType": "sc:Text"},
    ]


def test_file_obj_dump_omits_unset_croissant_fields():
    file_obj = FileObj(system="s", name="a.bin", path="/a.bin", type="file")

    dumped = file_obj.model_dump()

    assert "sha256" not in dumped
    assert "columns" not in dumped


def test_file_obj_round_trips_stored_camel_case_dict():
    stored = {
        "system": "s",
        "name": "data.csv",
        "path": "/data.csv",
        "type": "file",
        "sha256": "b" * 64,
        "columns": [{"name": "x", "dataType": "sc:Integer"}],
    }

    assert FileObj.model_validate(stored).model_dump() == stored


def test_file_column_requires_name():
    with pytest.raises(pydantic.ValidationError):
        FileColumn(data_type="sc:Text")
