denox run start
deno run --watch --allow-net --unstable --allow-read --allow-env mod.ts
deno run \
  --compat --unstable \
  --allow-read --allow-write=./ --allow-env \
  node_modules/** mod.ts