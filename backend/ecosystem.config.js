module.exports = {
  apps: [{
    name: 'icq-backend',
    script: 'npm',
    args: 'start',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env',
    watch: false,
    max_memory_restart: '500M'
  }]
};
