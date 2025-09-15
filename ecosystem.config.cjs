module.exports = {
  apps: [
    {
      name: "eyey-backend",
      script: "index.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 8000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      // Logging
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Restart policy
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 10,

      // Watch for file changes (development only)
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],

      // Environment variables
      env_file: ".env",

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: "node",
      host: "localhost",
      ref: "origin/main",
      repo: "git@github.com:yourusername/eyey-backend.git",
      path: "/var/www/eyey-backend",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.cjs --env production",
    },
  },
};
