# ComfyUI Model Inventory — Bomb Ecom OS

## Quick Reference: What Each Model Does

| Model | Use Case | Workflow |
|-------|----------|----------|
| **Flux Dev fp8** | Base text-to-image | Everything — required backbone |
| **IP-Adapter** | Reference image + prompt → styled output | Clone winning ad's vibe for your product |
| **ControlNet Union Pro 2.0** | Pose/depth/canny extraction | Same pose as winning ad, new image |
| **PuLID** | Face identity preservation | Same "actor" face across all UGC creatives |
| **Redux** | Image variations with steering | Generate 10 variations of a winning concept |
| **Kontext** | Text-guided image editing | "Replace the coffee mug with hand massager" |
| **Fill** | Inpainting / masked editing | Precisely swap product while keeping scene |
| **4x-UltraSharp** | Upscale 1024→4096px | Final production assets (product shots) |
| **RealESRGAN x4plus** | Upscale (organic textures) | Final production assets (UGC/lifestyle) |

---

## The Killer Combo (What fal.ai Can't Do)

Stack these together for ad cloning:

```
Winning competitor UGC ad
    │
    ├── PuLID ──────────► Same face, different product/scene
    ├── IP-Adapter ─────► Same style/vibe, your product
    ├── Redux ──────────► Variations of the same concept
    ├── Kontext ────────► Edit the product out, put yours in
    └── ControlNet ─────► Same pose, completely new image
```

**IP-Adapter + ControlNet + PuLID stacked:**
- IP-Adapter: copies the lighting/style from winning ad
- ControlNet: copies the exact pose
- PuLID: uses your UGC "actor" face
- Your prompt: describes your product
- Result = ad that *looks* like the winner, same pose, same actor, YOUR product

---

## Model Files & Locations

### Required: Base Model + Encoders
| File | Folder | Size |
|------|--------|------|
| `flux1-dev-fp8.safetensors` | `models/diffusion_models/` | 11.9 GB |
| `t5xxl_fp8_e4m3fn.safetensors` | `models/clip/` | 4.89 GB |
| `clip_l.safetensors` | `models/clip/` | 246 MB |
| `ae.safetensors` | `models/vae/` | 335 MB |

### Reference Image + Prompt (Ad Cloning)
| File | Folder | Size | What It Does |
|------|--------|------|--------------|
| `instantx_flux1_dev_ip_adapter_bf16.safetensors` | `models/ipadapter/` | 5.29 GB | Style/composition from reference image |
| `flux1-redux-dev.safetensors` | `models/style_models/` | ~12 GB | Image variations with text steering |
| `flux1-kontext-dev_fp8_scaled.safetensors` | `models/diffusion_models/` | ~12 GB | Text-guided editing ("change X keep Y") |
| `pulid_flux_v0.9.1.safetensors` | `models/pulid/` | ~1 GB | Face identity preservation |

### Pose/Composition Matching
| File | Folder | Size |
|------|--------|------|
| `flux-controlnet-union-pro-2.0.safetensors` | `models/controlnet/` | 4.28 GB |

Supports: Canny (0), Tile (1), Depth (2), Blur (3), Pose (4), Gray (5), Low Quality (6)

### Inpainting
| File | Folder | Size |
|------|--------|------|
| `flux1-fill-dev-fp8.safetensors` | `models/diffusion_models/` | ~12 GB |

### Upscalers
| File | Folder | Size |
|------|--------|------|
| `4x-UltraSharp.safetensors` | `models/upscale_models/` | 67 MB |
| `RealESRGAN_x4plus.safetensors` | `models/upscale_models/` | 67 MB |

---

## Required Custom Nodes

Install via ComfyUI Manager (http://localhost:8188 → Manager button):

1. **comfyui_controlnet_aux** (Fannovel16) — OpenPose preprocessor for ControlNet
2. **ComfyUI-IPAdapter-Flux** (Shakker-Labs) — IP-Adapter nodes for Flux
3. **ComfyUI-GGUF** (city96) — GGUF model loader (if using GGUF quantizations)
4. **PuLID_ComfyUI** (cubiq) — PuLID face identity nodes

---

## VRAM Strategy (16 GB RX 9060 XT)

| Workflow | VRAM Usage | Notes |
|----------|-----------|-------|
| Text-to-image (Flux fp8 alone) | ~12 GB | Fits cleanly |
| + ControlNet | ~17 GB | Use `--lowvram` flag |
| + IP-Adapter | ~18 GB | Use `--lowvram` flag |
| Inpainting (Fill fp8) | ~13 GB | Fits with headroom |
| IP-Adapter + ControlNet + PuLID | ~20 GB | Use `--lowvram`, text encoders on CPU |

**Launch flag for 16 GB:** `--lowvram --use-pytorch-cross-attention`

---

## Download Script

```powershell
powershell -ExecutionPolicy Bypass -File scripts\comfyui\download-all-models.ps1
```

## Launch ComfyUI

```
scripts\comfyui\launch-local.bat
```

Then open: **http://localhost:8188**
