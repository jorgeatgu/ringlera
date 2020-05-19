// ------ JavaScript
import babel from 'rollup-plugin-babel';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';


// ------ postCSS
import postcss from 'rollup-plugin-postcss';
import atImport from 'postcss-import';
import selector from 'postcss-custom-selectors';
import customProperties from 'postcss-custom-properties';
import sorting from 'postcss-sorting';
import nested from 'postcss-nested';
import stylelint from 'rollup-plugin-stylelint';

// ------ global
import resolve from '@rollup/plugin-node-resolve';
import browsersync from 'rollup-plugin-browsersync';



const paths = {
  js: 'src/js',
  css: 'src/css',
  images: 'src/img/*',
  distCss: 'css/',
  distJs: 'js/',
  distImages: 'img/'
};

const plugins = [
  eslint({
    exclude: [
      paths.css + '/**'
    ]
  }),
  babel({
    babelrc: false,
    exclude: 'node_modules/**',
    presets: [
      [
        '@babel/preset-env',
        {
          corejs: 3,
          useBuiltIns: 'usage',
        },
      ],
    ],
  }),
  browsersync({
    host: 'localhost',
    port: 3000,
    server: {
      baseDir: ['./']
    },
    files: [
      'src/**',
      'csv/*.*',
      './*.html'
    ],
    open: true
  }),
  resolve(),
  nodePolyfills(),
  commonjs(),
  globals(),
  builtins()
];

export default [{
    input: paths.js + '/index.js',
    output: [{
        file: paths.distJs + '/index.js',
        format: 'umd',
        external: ['xmlToJson']
      }
    ],
    plugins
  },
  {
    input: paths.js + '/d3.js',
    output: {
      file: paths.distJs + '/d3.min.js',
      format: 'umd',
      name: 'd3',
      moduleName: 'd3',
      external: ['d3']
    },
    plugins
  },
  {
    input: paths.css + '/styles.css',
    output: {
      file: paths.distCss + '/styles.css',
      format: 'es'
    },
    plugins: [
      stylelint(),
      postcss({
        extract: true,
        sourceMap: true,
        plugins: [
          atImport(),
          selector(),
          customProperties(),
          sorting(),
          nested()
        ],
        extensions: ['.css'],
        minimize: true
      })
    ]
  },
  {
    watch: {
      include: ['src/**', './*.html', 'csv/**', 'js/**']
    }
  }
];
