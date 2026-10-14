@echo off
cd /d "%~dp0"
"%LOCALAPPDATA%\miniconda3\envs\general_tools_env\python.exe" -m streamlit run app.py
