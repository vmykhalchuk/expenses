@echo off
cd gas
call clasp pull
cls
git diff
pause