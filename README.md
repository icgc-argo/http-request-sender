# HTTP Request Sender

This is a simple NodeJS script that will send a single HTTP request based on a the provided environment variables.

The purpose is to build a Docker image that can be run as a Kubernetes or CronJob to send scheduled web requests from within a cluster. This could be used to insert messages into a queue or to trigger an API request on another service.

There are no build processes or tests included, at the moment. The script is short and sweet.

## Configuration

The properties available to define the web request sent are summarized below. They can be provided through the system environment variables, or through a `.env` file in the same directory as the running script. A `.env.schema` file is provided as an example.

| Property | Optional | Default                          | Description                                                                                                                                                                                |
| -------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| METHOD   | Optional | get                              | HTTP request method. Use lowercase name. Examples: `get`, `post`, `delete`, `patch`, `put`, `head`,                                                                                        |
| PROTOCOL | Optional | http                             | Request protocol. `http` or `https`                                                                                                                                                        |
| HOST     | Required | --                               | Host for request URL. Example: `google.com` or `localhost`                                                                                                                                 |
| PORT     | Optional | based on protocol, `80` or `443` | If URL is to a non-standard port, provide that port here.                                                                                                                                  |
| URL      | Optional | `/`                              | The request path after the host and port.                                                                                                                                                  |
| HEADERS  | Optional | No Headers                       | A JSON object, provided as a string, containing key:value pairs of strings that will be passed as headers to the request. If JSON parsing fails, the script will fail to send the request. |
| BODY     | Optional | No Body                          | Body content to send in the request. The script will attempt to parse this as JSON, and if this fails it will be sent as the string provided.                                              |
