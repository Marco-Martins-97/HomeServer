from gpiozero import Button
from subprocess import call
import signal

# GPIO pin numbers (BCM numbering)
SHUTDOWN_PIN = 21
RESTART_PIN  = 20

# hold_time = seconds the button must be held before action triggers
# This prevents accidental presses
shutdown_btn = Button(SHUTDOWN_PIN, pull_up=True, hold_time=3)
restart_btn  = Button(RESTART_PIN,  pull_up=True, hold_time=2)

def shutdown():
    print("Shutdown button held -  shutting down...")
    call(['sudo', 'shutdown', 'now'])

def restart():
    print("Restart button held - rebooting...")
    call(['sudo', 'reboot'])

shutdown_btn.when_held = shutdown
restart_btn.when_held  = restart

print("Button listener running. Hold shutdown 3s or restart 2s.")

# Keep the script running indefinitely
signal.pause()
