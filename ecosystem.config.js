module.exports = {
  apps: [{
    name: 'gestor-landings',
    cwd: './server',
    script: 'src/index.js',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '../.env',
    max_memory_restart: '300M',
    error_file: '../logs/err.log',
    out_file: '../logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }],
}
