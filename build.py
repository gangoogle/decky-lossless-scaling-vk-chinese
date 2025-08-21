import os
import shutil
import zipfile
import json

# 读取插件名和版本号
with open("package.json", "r", encoding="utf-8") as f:
    data = json.load(f)
PLUGIN_NAME ="Lossless Scaling"
VERSION = data.get("version", "no-version")
OUTFILE = f"{PLUGIN_NAME}-{VERSION}-中文版.zip"

REQUIRED_FILES = ["package.json", "plugin.json", "LICENSE","main.py", "README.md", "defaults.txt", "shared_config.py"]
OPTIONAL_FILES = []

# 新增输出目录
OUTPUT_DIR = "buildOutput"
PLUGIN_OUTPUT_PATH = os.path.join(OUTPUT_DIR, PLUGIN_NAME)

def prepare_folder():
    # 创建输出目录
    if os.path.exists(PLUGIN_OUTPUT_PATH):
        shutil.rmtree(PLUGIN_OUTPUT_PATH)
    os.makedirs(PLUGIN_OUTPUT_PATH, exist_ok=True)

    # dist 必须
    if os.path.exists("dist"):
        shutil.copytree("dist", os.path.join(PLUGIN_OUTPUT_PATH, "dist"))
    else:
        raise FileNotFoundError("❌ dist directory not found! Please run frontend build first.")

    # bin 可选
    if os.path.exists("bin"):
        shutil.copytree("bin", os.path.join(PLUGIN_OUTPUT_PATH, "bin"))

    # py_modules 可选
    if os.path.exists("py_modules"):
        shutil.copytree("py_modules", os.path.join(PLUGIN_OUTPUT_PATH, "py_modules"))

    # 复制必要文件
    for f in REQUIRED_FILES + OPTIONAL_FILES:
        if os.path.exists(f):
            shutil.copy(f, PLUGIN_OUTPUT_PATH)

def make_zip():
    out_zip_path = os.path.join(OUTPUT_DIR, OUTFILE)
    if os.path.exists(out_zip_path):
        os.remove(out_zip_path)
    with zipfile.ZipFile(out_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(PLUGIN_OUTPUT_PATH):
            for file in files:
                full_path = os.path.join(root, file)
                arcname = os.path.relpath(full_path, OUTPUT_DIR)
                zipf.write(full_path, arcname)
    print(f"✅ Build finished: {out_zip_path}")

if __name__ == "__main__":
    # 创建输出总目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    prepare_folder()
    make_zip()
    shutil.rmtree(PLUGIN_OUTPUT_PATH)
