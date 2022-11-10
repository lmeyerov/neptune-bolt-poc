# neptune-bolt-poc

Minimal implementation of the NodeJS example from the AWS Neptune docs for OpenCypher over the Neo4j driver

Optionally shows different driver calling conventions: transaction vs session, promise vs  stream)

## install

```bash
git clone git@github.com:lmeyerov/neptune-bolt-poc.git
cd neptune-bolt-poc
```

then

```bash
npm i
```

## configure 

* driver version: https://github.com/lmeyerov/neptune-bolt-poc/blob/main/package.json#L16
* neptune params: `region`, `host`, ...: https://github.com/lmeyerov/neptune-bolt-poc/blob/main/index.mjs#L9
* query: https://github.com/lmeyerov/neptune-bolt-poc/blob/main/index.mjs#L17

## run

```bash
AWS_ACCESS_KEY_ID='abc' \
AWS_SECRET_ACCESS_KEY='xyz' \
SERVICE_REGION='123' \
    node index.mjs
```
