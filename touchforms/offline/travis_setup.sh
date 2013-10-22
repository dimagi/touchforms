#!/bin/bash

wget -q -O DimagiKeyStore $KEYSTORE_URL

for line in $LOCAL_PROPS
do
  echo $line >> local.properties
done
