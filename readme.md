local run: npm run docs:dev
local build: npm run docs:build

scp -r dist root@47.102.127.243:~/vuepress/
ssh root@47.102.127.243
