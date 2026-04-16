#!/bin/bash

echo "sync plugin to docker----"
docker cp ./sdk/template-doc-agent onlyoffice-document-server:/var/www/onlyoffice/documentserver/sdkjs-plugins/

echo "restart service--------"
docker restart onlyoffice-document-server
echo "restart ok"