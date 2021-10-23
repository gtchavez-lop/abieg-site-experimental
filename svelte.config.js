/** @type {import('@sveltejs/kit').Config} */

import vercel from "@sveltejs/adapter-vercel";
import preprocess from "svelte-preprocess";

const config = {
  kit: {
    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",
    adapter: vercel(),
  },
  preprocess: preprocess(),
};

export default config;
