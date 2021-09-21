import { healthcheck } from '../healthcheck.mjs';

const namespace = process.argv[2];

healthcheck(namespace).then((response) => console.log(JSON.stringify(response)));
