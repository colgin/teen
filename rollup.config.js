import path from 'path'
import json from '@rollup/plugin-json'
// import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.js',
  output: [
    {
      file: path.resolve('lib/', 'teen.common.js'),
      format: 'cjs',
    },
    {
      file: path.resolve('lib/', 'teen.esm.js'),
      format: 'es',
    },
    // TODO
    // {
    //   file: path.resolve('lib/', 'teen.umd.js'),
    //   format: 'umd',
    //   name: 'teen',
    //   plugins: [terser()],
    // },
  ],
  plugins: [json()],
}
