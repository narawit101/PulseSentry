"""
Process and export the new PulseSentry cyber-shield logo with clean background removal (transparent alpha)
"""
import os
import numpy as np
from PIL import Image, ImageFilter

def remove_black_background(img: Image.Image) -> Image.Image:
    """Extract shield emblem and make pure black background completely transparent with smooth feathering"""
    img = img.convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    
    # Calculate brightness / max RGB
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    max_c = np.maximum(np.maximum(r, g), b)
    
    # Alpha mask: 0 for black (<16), 1.0 for bright (>48), smooth gradient between
    alpha = np.clip((max_c - 16.0) / (48.0 - 16.0), 0.0, 1.0) * 255.0
    
    # Apply alpha
    arr[:, :, 3] = alpha
    
    clean_img = Image.fromarray(arr.astype(np.uint8), "RGBA")
    return clean_img

def process_logo():
    src_img = r"C:\Users\Ice\.gemini\antigravity-ide\brain\d8667f04-0029-47df-90e7-d03de95e740e\sentinel_emblem_1788140293934.jpg"
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    assets_dir = os.path.join(base_dir, "assets")
    public_dir = os.path.join(base_dir, "public")
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    raw_img = Image.open(src_img)
    clean_img = remove_black_background(raw_img)
    
    # Save transparent PNGs
    clean_img.save(os.path.join(assets_dir, "icon.png"), format="PNG")
    clean_img.save(os.path.join(public_dir, "logo.png"), format="PNG")
    clean_img.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "logo-128.png"), format="PNG")

    # Generate multi-size transparent .ico for Windows (.exe and System Tray)
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
    ico_path = os.path.join(assets_dir, "icon.ico")
    clean_img.save(ico_path, format="ICO", sizes=icon_sizes)
    clean_img.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=icon_sizes)

    print(f"[+] Successfully generated transparent PulseSentry icons:")
    print(f"  - {ico_path}")
    print(f"  - {os.path.join(assets_dir, 'icon.png')}")
    print(f"  - {os.path.join(public_dir, 'logo.png')}")

if __name__ == "__main__":
    process_logo()
