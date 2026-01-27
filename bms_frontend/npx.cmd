@echo off
rem Local npx shim for keycloakify (forces local node_modules binaries)
setlocal
set "BIN=%~dp0node_modules\.bin"
set "PATH=%BIN%;%PATH%"
rem run the first arg command from local .bin
call "%BIN%\%1.cmd" %*
endlocal
