def is_positive_number(field: float) => float:
    if field < 0:
        raise ValueError(f'{field} is not a positive number')
    return field