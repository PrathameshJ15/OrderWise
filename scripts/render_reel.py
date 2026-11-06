import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio

# Video parameters
WIDTH, HEIGHT = 1080, 1920
FPS = 30
DURATION_SEC = 25
TOTAL_FRAMES = FPS * DURATION_SEC  # 750 frames

OUTPUT_PATH_1 = r"c:\Users\jadha\OneDrive\Desktop\OrderWise\brag-output\OrderWise_Instagram_Reel.mp4"
OUTPUT_PATH_2 = r"c:\Users\jadha\OneDrive\Desktop\OrderWise_Instagram_Reel.mp4"

# Color Palette
BG_COLOR = (8, 9, 13)            # #08090D
SURFACE_COLOR = (22, 22, 22)     # #161616
SURFACE_2_COLOR = (28, 28, 28)   # #1C1C1C
BORDER_COLOR = (42, 42, 42)      # #2A2A2A
PRIMARY_RED = (225, 29, 50)      # #E11D32
DARK_RED = (198, 40, 40)         # #C62828
BURGUNDY = (69, 10, 22)          # #450A16
TEXT_WHITE = (242, 242, 242)     # #F2F2F2
TEXT_MUTED = (161, 161, 170)     # #A1A1AA
GREEN_FULFILLED = (74, 222, 128) # #4ADE80
RED_DEFERRED = (255, 122, 122)   # #FF7A7A

# Fonts
try:
    font_hero = ImageFont.truetype("C:\\Windows\\Fonts\\segoeuib.ttf", 64)
    font_title = ImageFont.truetype("C:\\Windows\\Fonts\\segoeuib.ttf", 46)
    font_sub = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 32)
    font_card_head = ImageFont.truetype("C:\\Windows\\Fonts\\segoeuib.ttf", 34)
    font_body = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 28)
    font_mono = ImageFont.truetype("C:\\Windows\\Fonts\\consolab.ttf", 26)
    font_mono_small = ImageFont.truetype("C:\\Windows\\Fonts\\consolab.ttf", 22)
    font_brand = ImageFont.truetype("C:\\Windows\\Fonts\\segoeuib.ttf", 36)
except Exception:
    font_hero = ImageFont.load_default()
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_card_head = ImageFont.load_default()
    font_body = ImageFont.load_default()
    font_mono = ImageFont.load_default()
    font_mono_small = ImageFont.load_default()
    font_brand = ImageFont.load_default()

def draw_header(draw, frame_idx):
    # Top brand bar
    top_y = 120
    # Red logo badge
    draw.rounded_rectangle([70, top_y, 70 + 64, top_y + 64], radius=16, fill=DARK_RED)
    draw.text((90, top_y + 10), "O", fill=(255, 255, 255), font=font_brand)
    
    # Brand name
    draw.text((150, top_y + 12), "Order", fill=TEXT_WHITE, font=font_brand)
    draw.text((250, top_y + 12), "Wise", fill=PRIMARY_RED, font=font_brand)
    
    # Sub badge
    badge_x = 730
    draw.rounded_rectangle([badge_x, top_y + 10, badge_x + 280, top_y + 54], radius=22, fill=(40, 10, 15), outline=PRIMARY_RED, width=2)
    draw.text((badge_x + 25, top_y + 17), "SUPPLY CHAIN ENGINE", fill=PRIMARY_RED, font=font_mono_small)

def draw_footer(draw, frame_idx):
    bot_y = 1800
    draw.text((70, bot_y), "@OrderWise", fill=TEXT_MUTED, font=font_body)
    draw.text((730, bot_y), "25s Launch Reel", fill=TEXT_MUTED, font=font_mono_small)

def draw_red_mesh_waves(draw, frame_idx):
    # Flowing wave ribbons
    t = frame_idx / 30.0
    # Top-right curves
    for i in range(7):
        offset = i * 22
        phase = t * 1.5 + i * 0.4
        drift = math.sin(phase) * 18
        points = [
            (350 + offset * 1.2, -50),
            (620 + offset + drift, 240 + offset * 0.5),
            (850 + offset * 0.8 - drift, 360 + offset * 0.8),
            (1150, 420 + offset + drift)
        ]
        # Draw curved segments
        curve_pts = []
        for s in range(40):
            u = s / 39.0
            x = (1-u)**3 * points[0][0] + 3*(1-u)**2 * u * points[1][0] + 3*(1-u)*u**2 * points[2][0] + u**3 * points[3][0]
            y = (1-u)**3 * points[0][1] + 3*(1-u)**2 * u * points[1][1] + 3*(1-u)*u**2 * points[2][1] + u**3 * points[3][1]
            curve_pts.append((x, y))
        opacity_ratio = max(0.2, 1.0 - (i / 7.0))
        r = int(225 * opacity_ratio)
        g = int(29 * opacity_ratio)
        b = int(50 * opacity_ratio)
        draw.line(curve_pts, fill=(r, g, b), width=3 if i % 2 == 0 else 2)

    # Bottom-left curves
    for i in range(5):
        offset = i * 24
        phase = t * 1.2 + i * 0.5
        drift = math.cos(phase) * 16
        points = [
            (-80, 1600 + offset),
            (240 + offset + drift, 1500 - offset * 0.4),
            (560 + offset * 0.6 - drift, 1580 + offset * 0.6),
            (950, 1720 + offset)
        ]
        curve_pts = []
        for s in range(40):
            u = s / 39.0
            x = (1-u)**3 * points[0][0] + 3*(1-u)**2 * u * points[1][0] + 3*(1-u)*u**2 * points[2][0] + u**3 * points[3][0]
            y = (1-u)**3 * points[0][1] + 3*(1-u)**2 * u * points[1][1] + 3*(1-u)*u**2 * points[2][1] + u**3 * points[3][1]
            curve_pts.append((x, y))
        draw.line(curve_pts, fill=(160, 20, 35), width=2)

def render_frame(frame_idx):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Red wave mesh
    draw_red_mesh_waves(draw, frame_idx)

    # Header & Footer
    draw_header(draw, frame_idx)
    draw_footer(draw, frame_idx)

    time_sec = frame_idx / 30.0

    # -------------------------------------------------------------
    # SCENE 1: The Scarcity Hook (0.0s – 4.5s)
    # -------------------------------------------------------------
    if time_sec < 4.5:
        # Main headline
        draw.text((70, 320), "40 Units in Stock.", fill=TEXT_WHITE, font=font_hero)
        draw.text((70, 410), "75 Units Ordered.", fill=PRIMARY_RED, font=font_hero)
        draw.text((70, 500), "Who gets fulfilled?", fill=TEXT_MUTED, font=font_title)

        # Scarcity SKU Card
        card_y = 660
        draw.rounded_rectangle([70, card_y, 1010, card_y + 680], radius=24, fill=SURFACE_COLOR, outline=BORDER_COLOR, width=2)

        # SKU Header
        draw.text((110, card_y + 45), "Pressure Gauge Pro", fill=TEXT_WHITE, font=font_card_head)
        draw.text((110, card_y + 90), "SKU: GAUGE-P300 • Critical Refinery Asset", fill=TEXT_MUTED, font=font_mono_small)
        
        # Stock badge
        draw.rounded_rectangle([780, card_y + 40, 960, card_y + 95], radius=10, fill=(50, 15, 20), outline=PRIMARY_RED, width=2)
        draw.text((800, card_y + 55), "40 ON HAND", fill=PRIMARY_RED, font=font_mono)

        # 3 Competing Orders
        orders = [
            ("Charlie (Refinery Plant)", "30 Requested", "HIGH Priority", PRIMARY_RED),
            ("Alice (Petrochemical Corp)", "25 Requested", "HIGH Priority", PRIMARY_RED),
            ("Bob (Standard Pipeline)", "20 Requested", "MED Priority", TEXT_MUTED),
        ]
        
        for idx, (client, req, prio, prio_col) in enumerate(orders):
            row_y = card_y + 170 + idx * 150
            draw.rounded_rectangle([110, row_y, 970, row_y + 120], radius=16, fill=SURFACE_2_COLOR, outline=BORDER_COLOR, width=1)
            draw.text((140, row_y + 25), client, fill=TEXT_WHITE, font=font_body)
            draw.text((140, row_y + 65), req, fill=TEXT_MUTED, font=font_mono)
            draw.text((750, row_y + 45), prio, fill=prio_col, font=font_mono)

    # -------------------------------------------------------------
    # SCENE 2: Deterministic Business Rules (4.5s – 9.5s)
    # -------------------------------------------------------------
    elif time_sec < 9.5:
        draw.text((70, 320), "Deterministic Allocation", fill=TEXT_WHITE, font=font_hero)
        draw.text((70, 410), "No guesswork. Mathematical business rules.", fill=TEXT_MUTED, font=font_sub)

        # Hierarchy badge
        draw.rounded_rectangle([70, 480, 1010, 550], radius=12, fill=(28, 28, 28), outline=BORDER_COLOR, width=1)
        draw.text((100, 500), "RULE HIERARCHY: Priority > Promised Date > FIFO Creation", fill=PRIMARY_RED, font=font_mono_small)

        # Queue Resolution
        queue_data = [
            ("Charlie (HIGH)", "30 / 30 FULFILLED", 1.0, GREEN_FULFILLED, "Allocated 30 units (available: 40)"),
            ("Alice (HIGH)", "0 / 25 DEFERRED", 0.0, RED_DEFERRED, "10 left < Minimum acceptable 15"),
            ("Bob (MEDIUM)", "0 / 20 DEFERRED", 0.0, RED_DEFERRED, "0 stock remaining • No partial delivery"),
        ]

        for idx, (client, status, fill_ratio, stat_color, reason) in enumerate(queue_data):
            card_y = 600 + idx * 260
            draw.rounded_rectangle([70, card_y, 1010, card_y + 220], radius=20, fill=SURFACE_COLOR, outline=BORDER_COLOR, width=2)
            
            draw.text((110, card_y + 35), client, fill=TEXT_WHITE, font=font_card_head)
            draw.text((640, card_y + 35), status, fill=stat_color, font=font_mono)
            
            # Progress bar track
            track_y = card_y + 95
            draw.rounded_rectangle([110, track_y, 970, track_y + 24], radius=12, fill=(40, 40, 40))
            if fill_ratio > 0:
                fill_w = int(860 * fill_ratio)
                draw.rounded_rectangle([110, track_y, 110 + fill_w, track_y + 24], radius=12, fill=stat_color)
                
            draw.text((110, card_y + 145), reason, fill=TEXT_MUTED, font=font_body)

    # -------------------------------------------------------------
    # SCENE 3: Governed AI Assistant (9.5s – 14.5s)
    # -------------------------------------------------------------
    elif time_sec < 14.5:
        draw.text((70, 320), "Governed AI Co-Pilot", fill=TEXT_WHITE, font=font_hero)
        draw.text((70, 410), "AI recommends. Rules validate. Humans approve.", fill=TEXT_MUTED, font=font_sub)

        # AI Modal Card
        card_y = 540
        draw.rounded_rectangle([70, card_y, 1010, card_y + 820], radius=24, fill=SURFACE_COLOR, outline=PRIMARY_RED, width=2)

        # AI Badge
        draw.rounded_rectangle([110, card_y + 45, 450, card_y + 95], radius=10, fill=(45, 12, 18))
        draw.text((130, card_y + 57), "⚡ GROQ LLAMA-3 INFERENCE", fill=PRIMARY_RED, font=font_mono_small)

        draw.text((110, card_y + 130), "Automated Priority Assessment", fill=TEXT_WHITE, font=font_card_head)
        
        # Evidence Card
        draw.rounded_rectangle([110, card_y + 200, 970, card_y + 430], radius=16, fill=SURFACE_2_COLOR, outline=BORDER_COLOR, width=1)
        draw.text((140, card_y + 230), "EVIDENCE EXTRACTED FROM NOTES:", fill=TEXT_MUTED, font=font_mono_small)
        draw.text((140, card_y + 280), "\"Refinery unit shutdown risk if not received by Friday.\"", fill=TEXT_WHITE, font=font_body)
        draw.text((140, card_y + 350), "Recommendation: Elevate Bob to CRITICAL (96% Confidence)", fill=PRIMARY_RED, font=font_body)

        # Human Approval Action
        btn_y = card_y + 580
        draw.rounded_rectangle([110, btn_y, 970, btn_y + 120], radius=18, fill=DARK_RED)
        draw.text((250, btn_y + 40), "🔒 AUTHORIZED HUMAN APPROVAL", fill=(255, 255, 255), font=font_card_head)
        
        draw.text((220, card_y + 740), "Every decision stamped into immutable audit log", fill=TEXT_MUTED, font=font_body)

    # -------------------------------------------------------------
    # SCENE 4: What-If Simulation (14.5s – 19.5s)
    # -------------------------------------------------------------
    elif time_sec < 19.5:
        draw.text((70, 320), "Simulation Lab", fill=TEXT_WHITE, font=font_hero)
        draw.text((70, 410), "Model scenarios in-memory with zero live disruption.", fill=TEXT_MUTED, font=font_sub)

        # Simulation Card
        card_y = 540
        draw.rounded_rectangle([70, card_y, 1010, card_y + 820], radius=24, fill=SURFACE_COLOR, outline=BORDER_COLOR, width=2)

        draw.text((110, card_y + 50), "Scenario: +50 Emergency Restock", fill=TEXT_WHITE, font=font_card_head)
        
        # Diff Results
        draw.rounded_rectangle([110, card_y + 140, 970, card_y + 360], radius=16, fill=SURFACE_2_COLOR, outline=GREEN_FULFILLED, width=2)
        draw.text((140, card_y + 175), "BEFORE / AFTER IMPACT DIFF", fill=TEXT_MUTED, font=font_mono_small)
        draw.text((140, card_y + 230), "Alice (Petrochemical Corp):", fill=TEXT_WHITE, font=font_card_head)
        draw.text((140, card_y + 290), "DEFERRED  →  FULFILLED (25/25)", fill=GREEN_FULFILLED, font=font_card_head)

        # Protected Revenue Box
        draw.rounded_rectangle([110, card_y + 410, 970, card_y + 600], radius=16, fill=SURFACE_2_COLOR, outline=BORDER_COLOR, width=1)
        draw.text((140, card_y + 450), "KEY ACCOUNT REVENUE SAVED:", fill=TEXT_MUTED, font=font_mono_small)
        draw.text((140, card_y + 505), "+$18,400.00 ARR Protected", fill=GREEN_FULFILLED, font=font_hero)

        draw.text((160, card_y + 680), "Live database stock completely untouched during simulation", fill=TEXT_MUTED, font=font_body)

    # -------------------------------------------------------------
    # SCENE 5: Finale (19.5s – 25.0s)
    # -------------------------------------------------------------
    else:
        # Grand logo mark
        logo_y = 480
        draw.rounded_rectangle([440, logo_y, 440 + 200, logo_y + 200], radius=44, fill=DARK_RED)
        draw.text((490, logo_y + 25), "O", fill=(255, 255, 255), font=ImageFont.truetype("C:\\Windows\\Fonts\\segoeuib.ttf", 120))

        draw.text((180, 760), "Allocate Smarter.", fill=TEXT_WHITE, font=font_hero)
        draw.text((160, 850), "Fulfill What Matters.", fill=PRIMARY_RED, font=font_hero)

        draw.text((190, 980), "The Supply Chain Allocation Engine", fill=TEXT_MUTED, font=font_title)

        # Feature Badges
        badges = [
            "Deterministic Business Rules",
            "Governed AI Priority Co-Pilot",
            "Immutable Cryptographic Audit"
        ]
        for b_idx, b_text in enumerate(badges):
            b_y = 1120 + b_idx * 100
            draw.rounded_rectangle([160, b_y, 920, b_y + 70], radius=16, fill=SURFACE_COLOR, outline=BORDER_COLOR, width=1)
            draw.text((220, b_y + 18), "✓  " + b_text, fill=TEXT_WHITE, font=font_body)

        # CTA Button
        draw.rounded_rectangle([240, 1500, 840, 1610], radius=55, fill=DARK_RED)
        draw.text((310, 1530), "EXPLORE ORDERWISE →", fill=(255, 255, 255), font=font_title)
        draw.text((430, 1650), "orderwise.com", fill=TEXT_MUTED, font=font_mono)

    return np.array(img)

def main():
    print(f"Rendering OrderWise 25s Instagram Reel ({WIDTH}x{HEIGHT} @ {FPS}fps)...")
    os.makedirs(os.path.dirname(OUTPUT_PATH_1), exist_ok=True)
    
    writer = imageio.get_writer(OUTPUT_PATH_1, fps=FPS, codec='libx264', quality=8)
    
    for f in range(TOTAL_FRAMES):
        frame = render_frame(f)
        writer.append_data(frame)
        if (f + 1) % 75 == 0:
            print(f"Rendered frame {f + 1}/{TOTAL_FRAMES} ({(f + 1) // 30}s)...")
            
    writer.close()
    print(f"Reel saved to: {OUTPUT_PATH_1}")

    # Copy to Desktop
    import shutil
    shutil.copy2(OUTPUT_PATH_1, OUTPUT_PATH_2)
    print(f"Copied Reel to Desktop: {OUTPUT_PATH_2}")

if __name__ == "__main__":
    main()

