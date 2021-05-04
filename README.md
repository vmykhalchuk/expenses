# Expenses Tracker

## Windows instructions
1. Use gasToGit.bat to move code from GAS to GitHub
1. Use gitToGas.bat to move code from GitHub to GAS

## Setup on Windows
1. Download from Git
    1. git clone https://github.com/vmykhalchuk/expenses-tracker.git
    1. git config --local core.autocrlf false
    1. **Note:** use Notepad++ or any other editor that preserves line endings as they are
1. Setup Clasp
    1. See instructions: https://developers.google.com/apps-script/guides/clasp
        * npm install @google/clasp -g
1. Set proper ScriptId for your user
    1. Get ScriptId from your project (see instructions: https://developers.google.com/apps-script/guides/clasp)
    1. Run setClaspScriptId.bat with scriptId as a first argument
1. Login to Clasp
    * execute ```clasp login```
1. Enable the Apps Script API
    1. Visit https://script.google.com/home/usersettings
	1. wait before calling ```gitToGas.bat``` for few minutes for changes to propagate
