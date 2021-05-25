@echo off
setlocal
set /p scriptid="Enter Script ID: "
rem trim scriptid from the left (no good to code to trim right)
for /f "tokens=* delims= " %%a in ("%scriptid%") do set scriptid=%%a
if "!%scriptid%~" == "!~" goto END

@echo {"scriptId":"%scriptid%"} > gas\.clasp.json

:END
endlocal
pause