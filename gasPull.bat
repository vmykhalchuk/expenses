@echo off
cd gas
call clasp pull
cls
git add .
git diff --cached
pause