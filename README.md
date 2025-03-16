# Description
This is a showcase repo with the examples of the implementation for the real-time speech-to-text translation and text-to-speech answering.

The goal of this project is to establish realtime communication between speakers that do not speak the same language (like working with the french clients)

# Pre-requisites
To run certain AI models locally, you need to have a dedicated GPU

These demos were developed and were running on Ubuntu 22.04

## Drivers
Before trying to run any of the AI models, make sure that you have: 
- installed GPU drivers and `nvidia-smi` returns a screen similar to this:
```
Sun Mar 16 10:53:38 2025       
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 550.90.07              Driver Version: 550.90.07      CUDA Version: 12.4     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce RTX 3080 ...    Off |   00000000:01:00.0  On |                  N/A |
| N/A   40C    P3             31W /  115W |     980MiB /  16384MiB |     37%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+
                                                                                         
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|    0   N/A  N/A      2151      G   /usr/lib/xorg/Xorg                            344MiB |
|    0   N/A  N/A      2407      G   /usr/bin/gnome-shell                          155MiB |
|    0   N/A  N/A      2981      G   ...seed-version=20241030-180129.383000        280MiB |
|    0   N/A  N/A      3442      G   ...ures=SpareRendererForSitePerProcess        150MiB |
+-----------------------------------------------------------------------------------------+
```
- installed `cuda`, to check, run: `nvcc -V`, if it returns 
```
nvcc: NVIDIA (R) Cuda compiler driver
Copyright (c) 2005-2022 NVIDIA Corporation
Built on Wed_Sep_21_10:33:58_PDT_2022
Cuda compilation tools, release 11.8, V11.8.89
Build cuda_11.8.r11.8/compiler.31833905_0
```
, you're good to go

**Examples of required commands to install `cuda` is available in the `scripts/` folder**

# Tools selection
This demo covers two options:
- self-hosted (running models locally - requires nvidia GPU)
- using API services (paid)

# Usage
TODO:
