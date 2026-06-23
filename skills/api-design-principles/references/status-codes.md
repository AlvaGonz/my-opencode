# HTTP Status Codes

> Definitive reference grouped by category. Cross-referenced with PayPal API Standards and Microsoft Azure REST API Guidelines.

## 2xx Success

| Code | Name | When to Use | Common Misuse |
|---|---|---|---|
| **200** | OK | Generic success for `GET`, `PUT`, `PATCH`, `POST` (non-create). Return the resource representation. | Returning 200 when a resource was actually created (should be 201). Returning 200 with an error body. |
| **201** | Created | Success after `POST` or `PUT` that created a new resource. MUST include `Location` header pointing to the new resource. | Using 201 for non-create operations. Omitting the `Location` header. |
| **202** | Accepted | Request accepted for asynchronous processing. No guarantee of completion. Use for long-running operations, batch jobs. | Using 202 for synchronous operations. Not providing a way to track the operation status. |
| **204** | No Content | Success with no response body. Used for `DELETE` operations. Also for `PUT`/`PATCH` when returning the resource is unnecessary. | Returning 204 after a `GET` that found nothing (should be 404). Returning 204 with a body. |
| **206** | Partial Content | Partial `GET` response when the client used `Range` header. Used for large file downloads, range requests. | Returning 206 when the client didn't send a `Range` header. |

## 3xx Redirection

| Code | Name | When to Use | Common Misuse |
|---|---|---|---|
| **301** | Moved Permanently | Resource has a new permanent URL. Clients MUST update bookmarks/links. | Using 301 when the old URL should still work (use 308 instead). |
| **302** | Found | Temporary redirect. Client SHOULD use the same method on the new URL. | Using 302 for permanent moves (should be 301). |
| **304** | Not Modified | Used with `If-None-Match` / `If-Modified-Since` conditional requests. Body is empty. | Returning 304 with a body. Using 304 for non-conditional requests. |
| **307** | Temporary Redirect | Like 302 but guarantees the method and body are NOT changed. | Using 302 when you need to guarantee method preservation. |
| **308** | Permanent Redirect | Like 301 but guarantees the method and body are NOT changed. | Using 301 when you must preserve the request method. |

## 4xx Client Error

| Code | Name | When to Use | Common Misuse |
|---|---|---|---|
| **400** | Bad Request | Malformed request syntax, invalid framing, or deceptive routing. The client SHOULD NOT retry without modification. | Using 400 for authentication failures (should be 401). Using 400 for "not found" (should be 404). |
| **401** | Unauthorized | Authentication is required and was not provided, or the provided credentials are invalid. Note: the name is misleading — it means "unauthenticated." | Using 401 when the client is authenticated but lacks permission (should be 403). |
| **403** | Forbidden | The client is authenticated but lacks permission. Also used when the server wants to conceal the existence of a resource (use instead of 404 to avoid leaking info). | Using 403 for missing authentication (should be 401). |
| **404** | Not Found | The server cannot find the requested resource. Can also mean the URI is wrong or the resource hasn't been created yet. | Returning 404 for a `DELETE` on an already-deleted resource (Microsoft says return 204). |
| **405** | Method Not Allowed | The HTTP method is not supported for the target resource. Response MUST include an `Allow` header listing valid methods. | Returning 404 for an unsupported method. Omitting the `Allow` header. |
| **406** | Not Acceptable | The server cannot produce a response matching the `Accept` header. Common when client requests `application/xml` but server only supports `application/json`. | Returning 406 when the client sends an unsupported `Content-Type` (should be 415). |
| **409** | Conflict | The request conflicts with the current state of the server. Used for optimistic concurrency (`If-Match` failure), duplicate creation, or state conflicts. | Using 409 for validation errors (should be 422). Using 409 for rate limiting (should be 429). |
| **410** | Gone | The resource is intentionally gone and will not return. Used for deprecated resources that have been removed. | Using 410 for temporary unavailability (should be 503). |
| **415** | Unsupported Media Type | The `Content-Type` of the request body is not supported by the server. | Returning 400 when the media type is wrong. |
| **422** | Unprocessable Entity | (Per PayPal Standards) The request body is semantically invalid. Validation failures, business rule violations. The syntax is valid but the semantics are wrong. | Returning 400 for semantic validation failures. Using 500 for business logic errors. |
| **429** | Too Many Requests | Rate limit exceeded. MUST include `Retry-After` header. See PayPal rate limiting guidelines. | Returning 503 for rate limiting. Not including `Retry-After`. |

### PayPal's Allowed Status Codes

PayPal restricts REST APIs to a specific subset. Status codes not in this list MUST NOT be used:

| Code | PayPal Notes |
|---|---|
| **200 OK** | Generic success. |
| **201 Created** | POST resource creation. If resource already exists (idempotent retry), return 200. |
| **202 Accepted** | Async processing. |
| **204 No Content** | Success, no body. |
| **400 Bad Request** | Malformed payload, missing required field, data type error. |
| **401 Unauthorized** | Authentication required/absent. |
| **403 Forbidden** | Authenticated but not authorized (business-level auth failure). |
| **404 Not Found** | URI or resource not found. |
| **405 Method Not Allowed** | HTTP method not implemented. |
| **406 Not Acceptable** | Cannot produce requested media type. |
| **415 Unsupported Media Type** | Request body media type not supported. |
| **422 Unprocessable Entity** | Semantic validation error. |
| **429 Too Many Requests** | Rate limit exceeded. |
| **500 Internal Server Error** | Server-side software defect or outage. |
| **503 Service Unavailable** | Temporary maintenance. |

## 5xx Server Error

| Code | Name | When to Use | Common Misuse |
|---|---|---|---|
| **500** | Internal Server Error | Generic server error. A software defect or site outage. The client may retry after a delay. PayPal: "MUST NOT be utilized for client validation or logic error handling." | Returning 500 for validation errors. Returning 500 with stack traces or internal details. |
| **502** | Bad Gateway | The server, while acting as a gateway or proxy, received an invalid response from an upstream server. | Using 502 for application-level errors. |
| **503** | Service Unavailable | The server is temporarily unable to handle the request (maintenance, overload). SHOULD include `Retry-After` header. | Using 503 for rate limiting (should be 429). Using 503 for client errors. |
| **504** | Gateway Timeout | The server, while acting as a gateway, did not receive a timely response from an upstream server. | Using 504 when the server itself timed out (should be 503 or 500). |

## Quick Selection Guide

| Scenario | Code |
|---|---|
| `GET` succeeded, resource found | 200 |
| `POST` created a new resource | 201 |
| `DELETE` succeeded | 204 |
| `POST` request accepted but async | 202 |
| Request body is syntactically invalid | 400 |
| Missing or invalid auth token | 401 |
| Authenticated but no permission | 403 |
| Resource doesn't exist | 404 |
| Request body is semantically invalid | 422 |
| Too many requests, slow down | 429 (include `Retry-After`) |
| Server bug | 500 |
| Server temporarily down | 503 (include `Retry-After`) |

## Sources

- [PayPal API Standards — HTTP Status Codes](https://github.com/levid-gc/paypal-api-standards/blob/master/api-style-guide.md#http-status-codes)
- [Microsoft Azure REST API Guidelines — HTTP Return Codes](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#http-return-codes)
- [RFC 7231 — HTTP/1.1 Semantics and Content](https://tools.ietf.org/html/rfc7231)
- [RFC 6585 — Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585) (429, 511)
