import path from 'path'
import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/teen/index.js',
  output: [
    {
      file: path.resolve('dist/', 'teen.common.js'),
      format: 'cjs',
      exports: 'default',
    },
    {
      file: path.resolve('dist', 'teen.esm.js'),
      format: 'es',
    },
    {
      file: path.resolve('dist', 'teen.umd.js'),
      format: 'umd',
      name: 'teen',
      plugins: [terser()],
    },
  ],
  plugins: [json()],
}
