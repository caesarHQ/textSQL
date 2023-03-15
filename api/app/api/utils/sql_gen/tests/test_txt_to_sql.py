from typing import Union, OrderedDict, Any, List, Tuple, Callable, Dict

import pytest

from ..text_to_sql import text_to_sql_parallel
from ...table_selection import get_relevant_tables

Res = Dict[str, Union[List[OrderedDict[str, Any]], List[str]]]

inputs: List[Tuple[str, Callable[[str, Res], str], int]] = [
    (
        "What are the three highest income zip codes in San Jose",
        [lambda result: any(sub_result.get('zip_code', None) == '95113' for sub_result in result),lambda result: all(sub_result.get('zip_code', None) != '94105' for sub_result in result)],
    ),
    (
        "10 highest crime cities in California",
        [lambda result: any(sub_result.get('city', '') == 'Los Angeles' for sub_result in result),
         lambda result: any(sub_result.get('city', '') != 'Los Gatos' for sub_result in result)]
    )
]


@pytest.mark.parametrize("input_query, expected_output_evaluate_funcs", inputs)
def test_always_fails(input_query, expected_output_evaluate_funcs):
    table_names =  ["crime_by_city", "demographic_data", "national_housing_market_data"]
    res = text_to_sql_parallel(input_query, table_names)
    for evaluate in expected_output_evaluate_funcs:
        assert_res = evaluate(res[0]['results'])
        assert assert_res is True
