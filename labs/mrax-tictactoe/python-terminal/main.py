#!/usr/bin/env python3
"""
MRX Tic-Tac-Toe - Terminal Version
==================================
Run with: python main.py
"""
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from handlers.game_handler import main

if __name__ == "__main__":
    main()
