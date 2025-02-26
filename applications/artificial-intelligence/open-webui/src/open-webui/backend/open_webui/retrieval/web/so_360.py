import logging
from typing import Optional

import requests
import json
import uuid
from open_webui.retrieval.web.main import SearchResult, get_filtered_results
from open_webui.env import SRC_LOG_LEVELS

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["RAG"])


def search_360_so(
    query_url: str,
    api_key: str,
    query: str,
    count: int,
    filter_list: Optional[list[str]] = None,
    **kwargs,
) -> list[SearchResult]:
    """Search using 360 so's Programmable Search API and return the results as a list of SearchResult objects.
    Handles pagination for counts greater than 10.

    Args:
        query_url (str): The base URL of the 360 SO server.
        api_key (str): A Programmable Search API key
        query (str): The query to search for
        count (int): The number of results to return (max 100, as 360 SO max results per query is 30)
        filter_list (Optional[list[str]], optional): A list of keywords to filter out from results. Defaults to None.

    Returns:
        list[SearchResult]: A list of SearchResult objects.
    """

    if len(query) > 120:
        query = query[:120]

    if "<query>" in query_url:
        query_url = query_url.split("?")[0]
    log.info(f"searching {query_url}")

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key,
    }

    model = kwargs.get("model", "allso-j2")

    all_results = []
    while count > 0:
        num_results_this_page = min(count, 30)  # 360 so max results per page is 30
        params = {
            "query": query,
            "count": num_results_this_page,
            "request_id": generate_uuid(),
            "model": model,
        }
        response = requests.request("GET", query_url, headers=headers, params=params)
        response.raise_for_status()
        json_response = response.json()


        results = json_response.get("data", {}).get("output_results", [])

        if results:  # check if results are returned. If not, no more pages to fetch.
            all_results.extend(results)
            count -= len(
                results
            )  # Decrement count by the number of results fetched in this page.
        else:
            break  # No more results from Google PSE, break the loop

    if filter_list:
        all_results = get_filtered_results(all_results, filter_list)

    res =  [
        SearchResult(
            link=result["url"],
            title=result.get("title"),
            snippet=result.get("summary_large"),
        )
        for result in all_results
    ]

    return res


def generate_uuid():
    """
    Returns:
        str: UUID
    """
    return str(uuid.uuid4())