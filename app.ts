import { appconfig, json, opine, urlencoded } from './deps.ts';
import { opineCors } from 'https://deno.land/x/cors@v1.2.2/mod.ts';

const port = appconfig.port ? appconfig.port : 3000;
const env = appconfig.environment ? appconfig.environment : 'development';
const app = opine();

app.use(json());
app.use(urlencoded());
app.use(opineCors());
app.set('env', env);
app.set('port', port);

export default app;
