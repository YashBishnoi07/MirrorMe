# 🪞 MirrorMe: The Evolutionary Digital Twin

MirrorMe is a next-generation "Digital Twin" agent that learns from your data, mimics your personality, and evolves as you interact with it. Built with a focus on local performance, privacy, and rich aesthetics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-yellow.svg)
![Next.js](https://img.shields.io/badge/next.js-15-black.svg)

## ✨ Core Features

### 🧠 Automated Persona Analysis
Leverages LLMs to intelligently deduce your personality traits and writing style from your knowledge base. No more manual setup—your twin discovers its own identity.

### 🎙️ Multi-Mode Voice Synthesis
The Mirror speaks. supports high-quality, zero-cost speech via **Edge TTS** or premium high-fidelity clones via **ElevenLabs**.

### 👁️ Multimodal Vision Memory
Powered by **Moondream**, your twin can "see" and "remember" images. It can analyze your sketches, critique your photography, or recall visual memories from your past.

### 🛡️ Privacy First
Designed to run locally. Your facts, your documents, and your persona stay on your machine, powered by **Ollama** and **ChromaDB**.

## 🛠️ Architecture
- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion.
- **Backend**: FastAPI, LangChain, ChromaDB.
- **AI Models**: 
  - Brain: `tinyllama` (1.1B)
  - Eyes: `moondream` (800M)
  - Embeddings: `nomic-embed-text`

## 🚀 Getting Started

### 1. Prerequisites
- [Ollama](https://ollama.ai/) installed.
- Node.js & Python 3.9+.

### 2. Pull the Models
```bash
ollama pull tinyllama
ollama pull moondream
ollama pull nomic-embed-text
```

### 3. Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### 4. Setup Frontend
```bash
cd frontend
npm install
```

### 5. Launch
Use the included startup scripts:
- `start.bat`: Automatically starts both the FastAPI server and the Next.js frontend.

## 🤝 Contributing
Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Created with ❤️ by **Yash**
