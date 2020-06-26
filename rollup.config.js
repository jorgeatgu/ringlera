import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/d3.js',
  output: {
    file: 'src/d3.min.js',
    format: 'umd',
    name: 'd3',
    moduleName: 'd3',
    external: ['d3']
  },
  plugins: [
    resolve()
  ]
};
