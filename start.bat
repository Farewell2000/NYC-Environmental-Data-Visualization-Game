@echo off
echo Starting NYC Environmental Data Visualization Game...

echo Starting backend server...
start cmd /k "cd backend && npm start"

echo Starting frontend server...
start cmd /k "http-server -p 8080"

echo Opening application in browser...
timeout /t 5
start http://localhost:8080

echo Setup complete! Application is running.