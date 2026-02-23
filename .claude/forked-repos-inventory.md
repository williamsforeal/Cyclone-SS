# Forked ComfyUI Repositories Inventory

**Date:** 2026-02-16
**Purpose:** Audit of available custom nodes and workflows in forked repositories for Flux image generation workflow development

---

## Summary

You have 5 forked ComfyUI-related repositories. Of these:
- **2 repositories contain useful custom nodes** for workflow development
- **1 repository is a package manager** (no custom nodes itself)
- **1 repository is the main ComfyUI fork** (core functionality, no custom workflows)
- **1 repository has issues or is inaccessible** (404 error)

**Key Finding:** The two custom node packages provide utility and efficiency improvements, but neither is specifically for Flux image generation. They're general-purpose ComfyUI enhancements.

---

## Repository Details

### 1. **comfyui-custom-scripts** ✅ USEFUL
- **Type:** Custom scripts and UI enhancements
- **Branch:** main
- **Key Features:**
  - Autocomplete for embeddings and custom words
  - Auto-arrange graph nodes in execution order
  - Always snap to grid option
  - Better loader lists with preview images
  - Checkpoint/LoRA/Embedding info viewer
  - Constrain Image node (resize with max/min bounds, optional crop)
  - Custom color picker for nodes and groups
  - Favicon status indicator
  - Image feed panel showing generated images
  - KSampler denoise helper
  - Math Expression evaluator
  - And more UI/UX improvements

**Best For:** Workflow organization, UI quality of life, prompt management

**Files:** `__init__.py`, `pysssss.py`, `pysssss.default.json`, `pysssss.example.json`, Python modules in `py/`, Web extensions in `web/js/`

---

### 2. **efficiency-nodes-comfyui** ✅ USEFUL
- **Type:** Custom nodes for workflow optimization
- **Branch:** main
- **Key Features:**
  - **Efficient Loader & Eff. Loader SDXL** - Advanced checkpoint/VAE/LoRA loaders with caching and preview images
  - **KSampler (Efficient)** - Modded samplers with live preview and seed management
  - **KSampler Adv. (Efficient)** - Advanced version with script execution support
  - **KSampler SDXL (Eff.)** - SDXL-specific sampler
  - **Script Nodes** - Pre-wired action chains:
    - XY Plot - Parameter grid generation for batch testing
    - HighRes-Fix - Upscaling through various methods (neural networks, ControlNet-guided)
  - AnimateDiff support
  - Token normalization and weight interpretation options
  - LoRA and ControlNet stacking

**Best For:** Batch processing, high-resolution workflows, parameter testing

**Files:** `efficiency_nodes.py`, `node_settings.json`, `requirements.txt`, `arial.ttf`

---

### 3. **comfyui-impact-pack** ❌ INACCESSIBLE
- **Type:** Custom nodes pack
- **Branch:** Main (note uppercase)
- **Status:** Returns 404 error - repository may be private, deleted, or access issue
- **Description (from API):** "Custom nodes pack for ComfyUI. This custom node helps to conveniently enhance images through Detector, Detailer, Upscaler, Pipe, and more."
- **Notable Features:**
  - Image detection nodes
  - Detail enhancement nodes
  - Upscaler nodes
  - Pipe/routing nodes
  
**Action Required:** Check repository permissions or visibility settings. This could be useful for image processing pipelines.

---

### 4. **ComfyUI-Manager** ✅ PACKAGE MANAGER ONLY
- **Type:** Extension manager for ComfyUI
- **Branch:** main
- **Purpose:** Install, remove, disable, and enable custom nodes. Provides hub access and convenience functions.
- **Not a source of custom nodes itself** - it's a management tool
- **Supports:** `uv` package manager, registry at https://registry.comfy.org/
- **Useful for:** Managing all the other custom nodes you install

**No workflows or specific nodes in this repo.**

---

### 5. **ComfyUI** ⚙️ CORE FORK
- **Type:** Main ComfyUI repository fork
- **Branch:** master
- **Purpose:** Core ComfyUI functionality
- **Status:** Contains workflows and CI/CD automation, but no custom nodes or Flux-specific workflows

**Workflow files found:** None detected (no workflow JSON files in root or obvious workflow directories)

---

## Analysis: Flux Image Generation Readiness

### What You HAVE:
1. General-purpose custom nodes for efficiency (caching, batching, upscaling)
2. UI enhancements for workflow development (autocomplete, graph arrangement)
3. Advanced sampler nodes with live preview and parameter testing
4. Package manager for installing additional nodes

### What You're MISSING for Flux Specifically:
- No Flux-specific nodes in these repos
- No Flux model loaders
- No Flux guidance/control nodes
- No Flux inpainting utilities
- No Flux LoRA application helpers

### Recommended Actions:

1. **Install via ComfyUI-Manager:**
   - Use the Manager to install community Flux nodes from registry.comfy.org
   - Search for: `flux`, `image-to-image`, `flux-guidance`

2. **Check for Missing Repos:**
   - Look for forked versions of:
     - `ComfyUI-FluxTrainer` (if training Flux)
     - `ComfyUI-Flux` (if community nodes exist)
     - `comfyui-api-nodes` (for external API integration)

3. **Consider Your Current Setup:**
   - You have Vertex AI and Bria integration in n8n (from MEMORY.md)
   - Consider whether you want Flux in ComfyUI workflows or continue via external APIs
   - The `efficiency-nodes-comfyui` XY Plot node is perfect for testing Flux parameters at scale

4. **Fix comfyui-impact-pack Access:**
   - Verify permissions on this repo - it could provide useful upscaling nodes for Flux outputs

---

## Next Steps

1. Check repository visibility of `comfyui-impact-pack`
2. List any other ComfyUI-related forks you may have
3. Determine if you want to add Flux nodes to your ComfyUI setup
4. Consider creating custom Flux workflow templates in the existing ComfyUI fork

---

**Generated by Claude Code** | 2026-02-16
