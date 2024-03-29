import type { UserConfig } from "vite";
import copy from "rollup-plugin-copy";
import vue from "@vitejs/plugin-vue";
import path from "path";

const config: UserConfig = {
  plugins: [
    vue(),
    // @ts-ignore
    copy({
      targets: [
        {
          src: "package.json",
          dest: "dist/",
          rename: "package.json",
          transform: (contents) => {
            // @ts-ignore
            let _contents = contents.toString().replaceAll("./dist/", "./");
            _contents = _contents.replaceAll("dist/", "");
            _contents = _contents
              .toString()
              .replaceAll(
                /"devDependencies": {([\S\s]+)}/gm,
                '"devDependencies": {}\n}',
              );
            _contents = _contents
              .toString()
              .replaceAll(/"scripts": {([\S\s]+)}/gm, '"scripts": {}\n}');
            return _contents;
          },
        },
        { src: "README.md", dest: "dist/", rename: "README.md" },
      ],
    }),
  ],

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "@fy-/head",
      formats: ["es", "cjs"],
      fileName: (format) => `fyhead.${format}.js`,
    },
    rollupOptions: {
      external: ["vue", "@vue/compiler-dom"],
      output: {
        exports: "named",
        sourcemap: true,
        dir: "./dist/",
        globals: {
          vue: "Vue",
          "@vue/compiler-dom": "VueCompilerDOM",
        },
      },
    },
    emptyOutDir: false,
  },
};

export default config;
