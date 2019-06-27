#!/bin/bash

# To use: create a file upload.sh in this folder, with these contents:
# #!/bin/bash
# CF_API_KEY=***API KEY*** \
# CF_EMAIL=***ACCOUNT EMAIL*** \
# CF_ACCOUNT_ID=***ACCOUNT ID*** \
# ./upload_public.sh


CF_ZONE=$(
	curl -sX GET "https://api.cloudflare.com/client/v4/zones?name=unicode.website&status=active&account.id=$CF_ACCOUNT_ID" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_API_KEY" \
  -H "Content-Type: application/json" | jq -r ".result[0].id")

curl -s "https://api.cloudflare.com/client/v4/zones/98321c14c41aa06a8d35651f34b40dfc/workers/scripts/unicode-lsr" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_API_KEY" \
  -H "Content-Type: application/javascript" \
  --upload-file lsr/script.js >/dev/null
