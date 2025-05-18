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

### (Optional) Install nvidia docker container toolkit
```sh
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

Test if the toolkit was installed correctly with:
`docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi`, if the output is returned - you're ready to use the docker compose setup from the demo

**Examples of required commands to install `cuda` is available in the `scripts/` folder**

# Tools selection
This demo covers two options:
- self-hosted (running models locally - requires nvidia GPU)
- using API services (paid)

# Usage
`docker-compose.yml` contains all required resources to run the demo with `docker compose up` 

## OS-level Dependencies
This demo uses CUDA 11.8, all of the dependencies are installed for CUDA 11.8. If your CUDA version is 12+, you need to reinstall all packages like torch against your CUDA version. 

To check your cuda version: `nvcc -V`

Use `docker compose`, but if you still want to run it locally, install: `sudo apt-get install curl ca-certificates ssh git ffmpeg portaudio19-dev libportaudio2 gcc build-essential -y`

**Use python3.10 as some of the piper dependencies might not install on Linux**

**Make sure to reinstall torch dependencies with the cuda version on your OS**
`pip uninstall torch torchaudio`
`pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu118`
`pip install coqui-tts`

### Cuda specific torch version installation
1. Run `nvcc -v` -> get the cuda version
1. `pip uninstall torch torchvision torchaudio`
1. `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118` - for cuda 11.8, update the link if cuda version is different
