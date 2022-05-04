Dim wsh
Set wsh = CreateObject("Wscript.Shell")
wsh.run "taskkill /f /im RemoteControl-local.exe", 0