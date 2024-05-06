echo off

echo -----------------------------------
echo NPM INSTALL
echo -----------------------------------
call npm install
echo *
echo *

echo ------------------------------------
echo INSTALLING NPM-RUN-ALL
echo -----------------------------------
call npm install -g npm-run-all

echo *
echo *
echo -----------------------------------
echo INSTALLLING WEBPACK
echo -----------------------------------
call npm install webpack

echo *
echo *
echo -----------------------------------
echo INSTALLING WEBPACK-CLI
echo -----------------------------------
call npm install -D webpack-cli
