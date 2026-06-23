## Migration to New Styling



## Adding Storybook to preview components

### Yarn install storybook

*yarn dlx storybook@latest init*

### If above command does not work because of Yarn version. 
*npx storybook@latest init*

#### Added vitest.config.ts file

```ts

    /// <reference types="vitest" />

        import { defineConfig } from "vitest/config";
        import react from "@vitejs/plugin-react";
        import tailwindcss from "@tailwindcss/vite";
        import { playwright } from "@vitest/browser-playwright";
        import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
        import { fileURLToPath } from "node:url";

        const srcPath = fileURLToPath(new URL("./src", import.meta.url));
        const storybookConfigDir = fileURLToPath(new URL("./.storybook", import.meta.url));

        export default defineConfig({
        plugins: [
            react(),
            tailwindcss(),
            storybookTest({
            configDir: storybookConfigDir,
            }),
        ],

        resolve: {
            alias: {
            "@": srcPath,
            },
        },

        define: {
            global: "window",
        },

        test: {
            name: "storybook",

            browser: {
            enabled: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
            },

            setupFiles: [".storybook/vitest.setup.ts"],

            css: true,
            globals: true,
        },
        });
  
```

### And create vitest.setup.ts file inside .storybook

```ts

        import { beforeAll } from "vitest";
        import { setProjectAnnotations } from "@storybook/react-vite";
        import * as previewAnnotations from "./preview";

        beforeAll(() => {
        setProjectAnnotations([previewAnnotations]);
        });

```

#### Then add this to package.json

```
   "test:storybook": "vitest --config vitest.config.ts"
```

#### Run 

* yarn storybook * and * yarn test:storybook *