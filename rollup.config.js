import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/d3.js',
  output: {
    file: 'src/d3.min.js',
    format: 'umd',
    name: 'd3'
  },
  plugins: [
    resolve()
  ]
};
