const { whenProd } = require('@craco/craco');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production-only optimizations
      if (env === 'production') {
        // Enable aggressive code splitting
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            cacheGroups: {
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                reuseExistingChunk: true,
              },
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true,
              },
            },
          },
          runtimeChunk: 'single',
        };

        // Add compression for static assets
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240, // Only compress files > 10kb
            minRatio: 0.8,
          })
        );

        // Enable bundle analysis in ANALYZE mode
        if (process.env.ANALYZE === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: 'bundle-report.html',
            })
          );
        }
      }

      return webpackConfig;
    },
  },
  // Enable TypeScript path aliases
  typescript: {
    enableTypeChecking: true,
  },
  // Optimize babel configuration
  babel: {
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage',
          corejs: 3,
          modules: false,
        },
      ],
    ],
    plugins: [
      // Enable optional chaining and nullish coalescing
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      // Add styled-components optimization
      [
        'babel-plugin-styled-components',
        {
          displayName: false,
          pure: true,
        },
      ],
    ],
  },
  // Configure Jest for optimal testing
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.tsx',
        '!src/serviceWorker.ts',
      ],
    },
  },
}; 