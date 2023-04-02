import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import run from '@rollup/plugin-run';
import copy from 'rollup-plugin-copy';

const isProd = process.env.NODE_ENV === 'production';

export default {
  input: 'app/index.ts',
  output: {
    file: 'dist/server.js',
    format: 'cjs',
  },
  plugins: [
    typescript(),
    isProd ? terser() : run(),
    copy({
      targets: [
        { src: 'app/assets', dest: 'dist/' },
        { src: 'app/.env', dest: 'dist/' },
        { src: 'package.json', dest: 'dist/' },
      ],
    }),
  ],
};
