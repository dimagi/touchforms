#! /bin/bash

curl -X POST http://localhost:4444 \
    -H content-type:text/json \
    -d "{
            \"action\": \"answer\",
            \"session-id\": 1,
            \"answer\": 1

        }"


