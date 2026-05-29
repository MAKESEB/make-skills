# ActivitySmith

ActivitySmith lets automations send push notifications and manage iOS Live Activities for paired devices. This app is based on the locally extracted `n8n-nodes-activitysmith` 1.0.5 package.

## API facts

- Base URL: `https://activitysmith.com/api`
- Authentication: `Authorization: Bearer <api key>`
- Credential validation: `POST /push-notification`
- Source static enums: Live Activity types `metrics`, `progress`, `segmented_progress`; colors `blue`, `cyan`, `green`, `lime`, `magenta`, `orange`, `purple`, `red`, `yellow`; action types `open_url` and `webhook`.

## Included modules

- **Send Push Notification**: `POST /push-notification`.
- **Start Live Activity**: `POST /live-activity/start`.
- **Update Live Activity**: `POST /live-activity/update`.
- **End Live Activity**: `POST /live-activity/end`.
- **Stream Live Activity**: `PUT /live-activity/stream/{streamKey}`.
- **End Live Activity Stream**: `DELETE /live-activity/stream/{streamKey}`.
- **Make an API Call** (`makeAnApiCall`): custom requests under `https://activitysmith.com/api`.

No webhook trigger modules were added. The source package supports sending webhook action payloads to user-provided URLs, but it does not expose an ActivitySmith callback registration/detach lifecycle for Make instant triggers.
