#!/bin/bash

docker cp ./sdk/template-doc-agent onlyoffice-document-server:/var/www/onlyoffice/documentserver/sdkjs-plugins/

docker restart onlyoffice-document-server