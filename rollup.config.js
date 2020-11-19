import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve'

export default {
  input: './src/main.js',
  output: [
    {
      file: 'dist/web-container.js',
      format: 'iife'
    },
    {
      file: 'dist/web-container.min.js',
      format: 'iife',
      name: 'version',
      plugins: [terser()]
    }
  ],
  plugins: [
    serve('dist')
  ]
};
