import { useState, useEffect } from "react";
import { 
  ModalRoot, 
  Field,
  Focusable,
  Button
} from "@decky/ui";
import { getDllStats, DllStatsResult, getConfigFileContent, getLaunchScriptContent, FileContentResult } from "../api/lsfgApi";

interface NerdStuffModalProps {
  closeModal?: () => void;
}

export function NerdStuffModal({ closeModal }: NerdStuffModalProps) {
  const [dllStats, setDllStats] = useState<DllStatsResult | null>(null);
  const [configContent, setConfigContent] = useState<FileContentResult | null>(null);
  const [scriptContent, setScriptContent] = useState<FileContentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all data in parallel
        const [dllResult, configResult, scriptResult] = await Promise.all([
          getDllStats(),
          getConfigFileContent(),
          getLaunchScriptContent()
        ]);
        
        setDllStats(dllResult);
        setConfigContent(configResult);
        setScriptContent(scriptResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatSHA256 = (hash: string) => {
    // Format SHA256 hash for better readability (add spaces every 8 characters)
    return hash.replace(/(.{8})/g, '$1 ').trim();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here if desired
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <ModalRoot onCancel={closeModal} onOK={closeModal}>
      {loading && (
        <div>正在加载信息...</div>
      )}
      
      {error && (
        <div>错误: {error}</div>
      )}
      
      {!loading && !error && (
        <>
          {/* DLL 信息区块 */}
          {dllStats && (
            <>
              {!dllStats.success ? (
                <div>{dllStats.error || "获取 DLL 信息失败"}</div>
              ) : (
                <div>
                  <Field label="DLL 路径">
                    <Focusable
                      onClick={() => dllStats.dll_path && copyToClipboard(dllStats.dll_path)}
                      onActivate={() => dllStats.dll_path && copyToClipboard(dllStats.dll_path)}
                    >
                      {dllStats.dll_path || "无数据"}
                    </Focusable>
                  </Field>
                  
                  <Field label="SHA256 哈希">
                    <Focusable
                      onClick={() => dllStats.dll_sha256 && copyToClipboard(dllStats.dll_sha256)}
                      onActivate={() => dllStats.dll_sha256 && copyToClipboard(dllStats.dll_sha256)}
                    >
                      {dllStats.dll_sha256 ? formatSHA256(dllStats.dll_sha256) : "无数据"}
                    </Focusable>
                  </Field>
                  
                  {dllStats.dll_source && (
                    <Field label="检测来源">
                      <div>{dllStats.dll_source}</div>
                    </Field>
                  )}
                </div>
              )}
            </>
          )}

          {/* 启动脚本区块 */}
          {scriptContent && (
            <Field label="启动脚本">
              {!scriptContent.success ? (
                <div>未找到脚本: {scriptContent.error}</div>
              ) : (
                <div>
                  <div style={{ marginBottom: "8px", fontSize: "0.9em", opacity: 0.8 }}>
                    路径: {scriptContent.path}
                  </div>
                  <Focusable
                    onClick={() => scriptContent.content && copyToClipboard(scriptContent.content)}
                    onActivate={() => scriptContent.content && copyToClipboard(scriptContent.content)}
                  >
                    <pre style={{ 
                      background: "rgba(255, 255, 255, 0.1)", 
                      padding: "8px", 
                      borderRadius: "4px", 
                      fontSize: "0.8em",
                      whiteSpace: "pre-wrap",
                      overflow: "auto",
                      maxHeight: "150px"
                    }}>
                      {scriptContent.content || "无内容"}
                    </pre>
                  </Focusable>
                </div>
              )}
            </Field>
          )}

          {/* 配置文件区块 */}
          {configContent && (
            <Field label="配置文件">
              {!configContent.success ? (
                <div>未找到配置: {configContent.error}</div>
              ) : (
                <div>
                  <div style={{ marginBottom: "8px", fontSize: "0.9em", opacity: 0.8 }}>
                    路径: {configContent.path}
                  </div>
                  <Focusable
                    onClick={() => configContent.content && copyToClipboard(configContent.content)}
                    onActivate={() => configContent.content && copyToClipboard(configContent.content)}
                  >
                    <pre style={{ 
                      background: "rgba(255, 255, 255, 0.1)", 
                      padding: "8px", 
                      borderRadius: "4px", 
                      fontSize: "0.8em",
                      whiteSpace: "pre-wrap",
                      overflow: "auto"
                    }}>
                      {configContent.content || "无内容"}
                    </pre>
                  </Focusable>
                </div>
              )}
            </Field>
          )}
          
            <Button onClick={closeModal}>
              关闭
            </Button>
        </>
      )}
    </ModalRoot>
  );
}
