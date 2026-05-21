' ==========================================================================
' run-hidden.vbs — Launch PowerShell scripts truly hidden (no window flash).
'
' Why this exists:
'   When Task Scheduler runs `powershell.exe -File ...` directly, a console
'   window flashes up briefly even with `-WindowStyle Hidden`. That breaks
'   Founder's focus during browsing/gaming. wscript.exe with Run(cmd, 0, ...)
'   sets ShowWindow=0 (SW_HIDE) BEFORE the process is created, so no flash.
'
' Usage:
'   wscript.exe run-hidden.vbs <path-to-ps1> [optional ps1 args ...]
'
' Wired by:
'   scripts/cron/install-hidden-tasks.ps1 (rewrites each PARBAUGHS-* task action)
' ==========================================================================

Option Explicit
Dim objShell, strScript, strArgs, i

Set objShell = CreateObject("Wscript.Shell")

If WScript.Arguments.Count = 0 Then
  ' No script path supplied — error out silently.
  WScript.Quit 1
End If

strScript = WScript.Arguments(0)

' Pass through any additional args after the script path.
strArgs = ""
For i = 1 To WScript.Arguments.Count - 1
  strArgs = strArgs & " """ & WScript.Arguments(i) & """"
Next

' Run hidden:
'   3rd arg = 0 (SW_HIDE — no window EVER appears)
'   4th arg = False (don't block; task finishes when PS finishes via its own exit)
objShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strScript & """" & strArgs, 0, False
