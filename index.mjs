import neo4j from "neo4j-driver";
import { HttpRequest }  from "@aws-sdk/protocol-http";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import crypto from "@aws-crypto/sha256-js";
const { Sha256 } = crypto;
import assert from "node:assert";

const region = "us-east-2";
const serviceName = "neptune-db";
const host = "neptunedbcluster-*****.us-east-2.neptune.amazonaws.com";
const port = 8182;
const protocol = "bolt";
const hostPort = host + ":" + port;
const url = protocol + "://" + hostPort;
//const readQuery = "MATCH (n)-[m]-(p) return n, m, p LIMIT 10";
const readQuery = "MATCH (n)-[]->(m) return n, m";
const params = {};

async function signedHeader() {
  const req = new HttpRequest({
    method: "GET",
    protocol: protocol,
    hostname: host,
    port: port,
    // Comment out the following line if you're using an engine version older than 1.2.0.0
    //path: "/opencypher",
    headers: {
      host: hostPort
    }
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: region,
    service: serviceName,
    sha256: Sha256
  });

  return signer.sign(req, { unsignableHeaders: new Set(["x-amz-content-sha256"]) })
    .then((signedRequest) => {
      const authInfo = {
        "Authorization": signedRequest.headers["authorization"],
        "HttpMethod": signedRequest.method,
        "X-Amz-Date": signedRequest.headers["x-amz-date"],
        "Host": signedRequest.headers["host"],
        "X-Amz-Security-Token": signedRequest.headers["x-amz-security-token"]
      };
      return JSON.stringify(authInfo);
    });
}

async function createDriver() {
  let authToken = { scheme: "basic", realm: "realm", principal: "username", credentials: await signedHeader() };

  return neo4j.driver(url, authToken, {
      encrypted: "ENCRYPTION_ON",
      trust: "TRUST_SYSTEM_CA_SIGNED_CERTIFICATES",
      maxConnectionPoolSize: 10,
      logging: neo4j.logging.console("debug")
    }
  );
}

function unmanagedTxnOrig(driver) {
	console.log('go')
  const session = driver.session();
  const tx = session.beginTransaction();
	console.log('go2');
  return tx.run(readQuery, params)
  .then((res) => {
	  console.log('got', res);
    // All good, the transaction will be committed
  })
  .catch(err => {
    // The transaction will be rolled back, now handle the error.
    console.log('oops', err);
  })
  .then(() => session.close());
}


function unmanagedTxnSessionStream(driver) {
  console.log('go')
  const session = driver.session();
  const feed = session.run(readQuery, params);
  feed.subscribe({
	  onNext: (v) => { console.log('next', v); },
	  onCompleted: (v) => { console.log('done', v); session.close(); driver.close(); },
	  onError: (v) => { console.error('oops', v); session.close(); driver.close(); }
  });
	console.log('go2');
}


function unmanagedTxn(driver) {
  console.log('go')
  const session = driver.session();
  const feed = session.run(readQuery, params);
  return feed.then(
	  (results) => { console.log('results', results); session.close(); driver.close(); },
	  (err) => { console.error('errors', err); session.close(); driver.close(); }
  );
}


createDriver()
.then((driver) => {
  return unmanagedTxn(driver);
})
.catch((err) => {
  console.log(err);
});
