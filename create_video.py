import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation

fig, ax = plt.subplots(figsize=(6, 4))
ax.set_xlim(0, 2 * np.pi)
ax.set_ylim(-1.5, 1.5)
ax.set_title("Example Video: Sine Wave Animation")
ax.set_xlabel("x")
ax.set_ylabel("y")

(line,) = ax.plot([], [], lw=2, color="steelblue")
x = np.linspace(0, 2 * np.pi, 300)


def init():
    line.set_data([], [])
    return (line,)


def update(frame):
    shift = frame * 0.1
    y = np.sin(x + shift)
    line.set_data(x, y)
    return (line,)


ani = animation.FuncAnimation(fig, update, frames=60, init_func=init, blit=True, interval=50)
ani.save("example_video.gif", writer="pillow", fps=20)
print("Saved example_video.gif")
plt.close()
