import socket
import ssl
import struct
from hyperframe.frame import Frame, SettingsFrame, WindowUpdateFrame, HeadersFrame, DataFrame

def download_hyperframes(host, port=443):
    """Connect to an HTTP/2 server and capture raw frames."""
    context = ssl.create_default_context()
    context.set_alpn_protocols(["h2"])

    with socket.create_connection((host, port)) as sock:
        with context.wrap_socket(sock, server_hostname=host) as ssock:
            if ssock.selected_alpn_protocol() != "h2":
                raise RuntimeError("Server does not support HTTP/2")

            # Send the HTTP/2 client preface
            ssock.sendall(b"PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n")

            # Send initial SETTINGS frame
            settings = SettingsFrame(stream_id=0)
            ssock.sendall(settings.serialize())

            frames = []
            buffer = b""
            while True:
                chunk = ssock.recv(4096)
                if not chunk:
                    break
                buffer += chunk
                while len(buffer) >= 9:
                    length = struct.unpack(">I", b"\x00" + buffer[:3])[0]
                    frame_len = 9 + length
                    if len(buffer) < frame_len:
                        break
                    frame_data = buffer[:frame_len]
                    buffer = buffer[frame_len:]
                    frame, _ = Frame.parse_frame_header(frame_data[:9])
                    frame.parse_body(memoryview(frame_data[9 : 9 + length]))
                    frames.append(frame)
                    print(f"  Frame type={type(frame).__name__} stream_id={frame.stream_id}")
                    if len(frames) >= 5:
                        return frames
    return frames


if __name__ == "__main__":
    host = "www.google.com"
    print(f"Downloading hyperframes from {host}...")
    try:
        frames = download_hyperframes(host)
        print(f"\nCaptured {len(frames)} frame(s).")
    except Exception as e:
        print(f"Error: {e}")
