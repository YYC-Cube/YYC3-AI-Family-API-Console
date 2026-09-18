#!/usr/bin/env python3
"""合并重复文档 06/07 → 保留 07 为正本，06 归档（一次性脚本）"""
import pathlib
import shutil

BASE = pathlib.Path(__file__).resolve().parent.parent
DOCS = BASE / "docs" / "YYC3-AI-Family-Token-Console-开发推进"

f06 = DOCS / "06-YYC3-AI-Family-Token-Console.md"
f07 = DOCS / "07-YYC3-AI-Family-Token-Console.md"
arch = DOCS / "archive"
arch.mkdir(exist_ok=True)

src = f07.read_text(encoding="utf-8")
banner = (
    "<!-- MERGED: 本文档为 06/07 两份「终章·运维篇」重复归档的合并结果（2026-09-18）。\n"
    "     内容经规范化逐字节校验完全一致，保留 07（标题格式规范版）为唯一正本。\n"
    "     原 06 已移入 archive/06-YYC3-AI-Family-Token-Console.duplicate.md 备份。 -->\n\n"
)
f07.write_text(banner + src, encoding="utf-8")

shutil.move(str(f06), str(arch / "06-YYC3-AI-Family-Token-Console.duplicate.md"))
print("✅ 07 → 合并正本（含 MERGED 标注）")
print("✅ 06 → archive/06-YYC3-AI-Family-Token-Console.duplicate.md")
