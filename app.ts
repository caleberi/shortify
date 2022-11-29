import { json, opine, urlencoded } from './deps.ts';
import { opineCors } from 'https://deno.land/x/cors@v1.2.2/mod.ts';

const app = opine();

app.use(json());
app.use(urlencoded());
app.use(opineCors());

export default app;
