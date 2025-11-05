import cookies from "js-cookie";
export function use_fetch() {
  async function make_request(
    uri,
    method = 'GET',
    body = {},
    headers = {
      "Content-Type": "application/json",
      "X-CSRFToken": cookies.get("csrftoken"),
      "Accept": "application/json",
    }
  ) {
    const options = { method, credentials: "same-origin", headers, };
    if (body) {
      options.body = JSON.stringify(body || {});
    }

    const response = await fetch(uri, options);

    return response;
  }

  return make_request;
}
