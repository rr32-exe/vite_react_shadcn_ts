				import worker, * as OTHER_EXPORTS from "/workspaces/vite_react_shadcn_ts/workers/worker.ts";
				import * as __MIDDLEWARE_0__ from "/workspaces/vite_react_shadcn_ts/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts";
import * as __MIDDLEWARE_1__ from "/workspaces/vite_react_shadcn_ts/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts";

				export * from "/workspaces/vite_react_shadcn_ts/workers/worker.ts";
				const MIDDLEWARE_TEST_INJECT = "__INJECT_FOR_TESTING_WRANGLER_MIDDLEWARE__";
				export const __INTERNAL_WRANGLER_MIDDLEWARE__ = [
					
					__MIDDLEWARE_0__.default,__MIDDLEWARE_1__.default
				]
				export default worker;