#!/bin/bash

wget -q -O keystore $KEYSTORE_URL

echo "keystore.path=keystore" >> local.properties
echo "keystore.alias=$KEY_ALIAS" >> local.properties
echo "keystore.password=$PASSWORD" >> local.properties
