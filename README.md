# HTTP Request Sender

This is a simple NodeJS script that will send a single HTTP request based on a the provided environment variables.

The purpose is to build a Docker image that can be run as a Kubernetes CronJob to send scheduled web requests from within a cluster. This could be used to insert messages into a queue or to trigger an API request on another service.

## Docker Images
Built docker images are hosted in GHCR: https://ghcr.io/icgc-argo/http-request-sender

## Helm Chart
There is no dedicated helm chart for this service, but there is a generic cron-job chart that was made for this purpose: https://github.com/icgc-argo/charts/tree/master/cron-job

## Ego Authorization

You can add an Ego Application Authorization token to your request by providing optional env configuration. The script will fetch an application JWT from ego before sending the configured request, and add the retrieved token to the request as an Authorization header.

This will not be done if any of the 3 Ego env variables are missing. Example config values required to enable this:

```
EGO_URL=https://ego.example.com/api
EGO_CLIENT_ID=my-ego-application
EGO_CLIENT_SECRET=secretpassword123
```

## Configuration

The properties available to define the web request sent are summarized below. They can be provided through the system environment variables, or through a `.env` file in the same directory as the running script. A `.env.schema` file is provided as an example.

| Property          | Optional | Default                          | Description                                                                                                                                                                                |
| ----------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| METHOD            | Optional | get                              | HTTP request method. Use lowercase name. Examples: `get`, `post`, `delete`, `patch`, `put`, `head`,                                                                                        |
| PROTOCOL          | Optional | http                             | Request protocol. `http` or `https`                                                                                                                                                        |
| HOST              | Required | --                               | Host for request URL. Example: `google.com` or `localhost`                                                                                                                                 |
| PORT              | Optional | based on protocol, `80` or `443` | If URL is to a non-standard port, provide that port here.                                                                                                                                  |
| URL               | Optional | `/`                              | The request path after the host and port.                                                                                                                                                  |
| HEADERS           | Optional | No Headers                       | A JSON object, provided as a string, containing key:value pairs of strings that will be passed as headers to the request. If JSON parsing fails, the script will fail to send the request. |
| BODY              | Optional | No Body                          | Body content to send in the request. The script will attempt to parse this as JSON, and if this fails it will be sent as the string provided.                                              |
| EGO_URL           | Optional | No ego auth used                 | URL to Ego API                                                                                                                                                                             |
| EGO_CLIENT_ID     | Optional | No ego auth used                 | Ego Application Client ID                                                                                                                                                                  |
| EGO_CLIENT_SECRET | Optional | No ego auth used                 | Ego Application Client Secret                                                                                                                                                              |
